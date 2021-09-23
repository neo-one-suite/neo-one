// tslint:disable no-any no-object-mutation
import { utils } from '@neo-one/utils';
import { comlink, endpoint } from '@neo-one/worker';
import nanoid from 'nanoid';
// @ts-ignore
import { adapterFun } from 'pouchdb-utils';
import { RequestArgs, RequestMessage, RequestType, ResponseMessage } from './types';

interface WorkerPouchOptions {
  readonly adapter: 'worker';
  readonly endpoint: () => endpoint.EndpointLike;
}

type Callback = (err: Error | undefined, content?: any) => void;

const parseError = (error: any) => {
  const mutableError = new Error();
  Object.entries(error).forEach(([key, val]) => {
    (mutableError as any)[key] = val;
  });

  return mutableError;
};

export function workerPouch(
  this: any,
  { endpoint: createEndpoint, adapter: _adapter, ...constructOpts }: WorkerPouchOptions,
  createAPI: (error: Error | undefined, api?: any) => void,
) {
  // tslint:disable-next-line:no-this-assignment
  const api = this;
  const instanceID = nanoid();
  const { port1, port2 } = new MessageChannel();
  const callbacks = new Map<string, Callback>();
  const changeListeners = new Map<string, (content: any) => void>();

  function onReceiveMessage(message: ResponseMessage) {
    if (message.type === 'uncaughtError') {
      api.emit('error', parseError(message.result));

      return;
    }

    const callback = callbacks.get(message.messageID);
    if (callback === undefined) {
      return;
    }

    switch (message.type) {
      case 'error':
        callbacks.delete(message.messageID);
        callback(parseError(message.result));
        break;
      case 'success':
        callbacks.delete(message.messageID);
        callback(undefined, message.result);
        break;
      case 'update':
        const changeListener = changeListeners.get(message.messageID);
        if (changeListener !== undefined) {
          changeListener(message.result);
        }
        break;
      default:
        utils.assertNever(message.type);
    }
  }

  function workerListener(event: MessageEvent) {
    if (event.data && event.data.instanceID === instanceID) {
      onReceiveMessage(event.data);
    }
  }

  port1.addEventListener('message', workerListener);
  port1.start();

  function postMessage(message: RequestMessage, messageEndpoint: comlink.Endpoint = port1) {
    messageEndpoint.postMessage(message, comlink.transferableProperties([message]));
  }

  let closed = false;
  function sendMessage(
    type: RequestType,
    args: RequestArgs,
    callback: Callback,
    messageID: string = nanoid(),
    messageEndpoint: comlink.Endpoint = port1,
  ) {
    if (api._destroyed) {
      callback(new Error(`${api.name} db was destroyed: ${type}`));

      return undefined;
    }

    if (closed) {
      callback(new Error(`${api.name} db was closed: ${type}`));

      return undefined;
    }

    if (type === 'close') {
      closed = true;
    }

    callbacks.set(messageID, callback);
    postMessage(
      {
        type,
        instanceID,
        messageID,
        args,
      },
      messageEndpoint,
    );

    return messageID;
  }

  api._remote = false;

  const createAdapterAPI =
    (type: RequestType, func?: (...args: any[]) => void) =>
    (...args: any[]) => {
      const funcArgs = args.slice(0, -1);
      sendMessage(type, funcArgs, args[args.length - 1]);
      if (func) {
        func(funcArgs);
      }
    };
  const createTopLevelAPI = (type: RequestType, func?: (...args: any[]) => void) =>
    adapterFun(type, createAdapterAPI(type, func));

  api.post = createTopLevelAPI('post');
  api.put = createTopLevelAPI('put');
  api.putAttachment = createTopLevelAPI('putAttachment');
  api.removeAttachment = createTopLevelAPI('removeAttachment');
  api.remove = createTopLevelAPI('remove');
  api.revsDiff = createTopLevelAPI('revsDiff');
  api.bulkGet = createTopLevelAPI('bulkGet');
  // compactDocument not needed, only called by compact
  api.compact = createTopLevelAPI('compact');
  api.get = createTopLevelAPI('get');
  api.getAttachment = createTopLevelAPI('getAttachment');
  api.allDocs = createTopLevelAPI('allDocs');
  // changes implemented below
  api._close = createAdapterAPI('close', () => {
    port1.removeEventListener('message', workerListener);
    port1.close();
  });
  api.info = createTopLevelAPI('info');
  api.id = createTopLevelAPI('id');
  api.type = () => 'worker';
  api.bulkDocs = createTopLevelAPI('bulkDocs');
  // registerDependentDatabase doesn't appear to be used
  api.destroy = createTopLevelAPI('destroy', () => {
    api._destroyed = true;
    api.emit('destroyed');
  });

  api._changes = (optsIn: any): any => {
    const { complete, onChange, processChange: _processChange, ...opts } = optsIn;
    if (opts.continuous) {
      const messageID = sendMessage('liveChanges', [opts], complete);
      if (messageID === undefined) {
        return;
      }

      changeListeners.set(messageID, onChange);

      return {
        cancel() {
          sendMessage('cancelChanges', [], complete, messageID);
          changeListeners.delete(messageID);
        },
      };
    }

    sendMessage('changes', [opts], (err, res) => {
      if (err) {
        complete(err);

        return;
      }
      res.results.forEach((change: any) => {
        onChange(change);
      });
      if (opts.returnDocs === false || opts.return_docs === false) {
        res.results = [];
      }
      complete(undefined, res);
    });
  };

  const worker = endpoint.getEndpoint(createEndpoint());
  worker.addEventListener('message', workerListener);
  endpoint.activate(worker);
  sendMessage(
    'construct',
    [port2, api.name, constructOpts],
    (error: Error | undefined) => {
      if (error) {
        createAPI(error);
      } else {
        createAPI(undefined, api);
      }
      worker.removeEventListener('message', workerListener);
    },
    nanoid(),
    worker,
  );
}

workerPouch.valid = () => true;
workerPouch.use_prefix = false;
