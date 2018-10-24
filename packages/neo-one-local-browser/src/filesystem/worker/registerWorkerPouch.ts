// tslint:disable no-any no-object-mutation
import { utils } from '@neo-one/utils';
import { comlink, endpoint } from '@neo-one/worker';
import nanoid from 'nanoid';
import stringify from 'safe-stable-stringify';
import { RequestArgs, RequestMessage, ResponseMessageType } from './types';

const createError = (err: any) => {
  const status = err.status == undefined ? 500 : err.status;

  if (err.name === 'Error' || err.name === 'TypeError') {
    err.name = err.message.indexOf('Bad special document member') !== -1 ? 'doc_validation' : 'bad_request';
  }

  return {
    error: err.name,
    name: err.name,
    reason: err.message,
    message: err.message,
    status,
  };
};

const dbs = new Map<string, PouchDB.Database>();
const users = new Map<string, number>();

export function registerWorkerPouch(
  selfIn: endpoint.EndpointLike,
  createPouch: (name: string, opts: any) => PouchDB.Database,
) {
  const self = endpoint.getEndpoint(selfIn);
  const disposers = new Map<string, { readonly dispose: () => void }>();
  const dbClosers: Set<() => void> = new Set();

  const getUserCount = (name: string) => {
    const count = users.get(name);

    return count === undefined ? 0 : count;
  };

  const listener = (initialEvent: MessageEvent) => {
    if (
      initialEvent.data &&
      initialEvent.data.type &&
      initialEvent.data.instanceID &&
      initialEvent.data.messageID &&
      initialEvent.data.args &&
      initialEvent.data.type === 'construct'
    ) {
      const constructMessage: RequestMessage = initialEvent.data;
      const { instanceID } = initialEvent.data;

      const [name, opts] = constructMessage.args.slice(1);
      let dbIn = dbs.get(name);
      if (dbIn === undefined) {
        dbIn = createPouch(name, opts);
        dbs.set(name, dbIn);
      }

      const db = dbIn;
      users.set(name, getUserCount(name) + 1);

      const allChanges = new Map<string, PouchDB.Core.Changes<any>>();
      const allChangesUsers = new Map<string, number>();
      const messageIDChangesCleanup = new Map<string, () => void>();
      const messageIDKey = new Map<string>();

      const getChangesUserCount = (key: string) => {
        const count = allChangesUsers.get(key);

        return count === undefined ? 0 : count;
      };

      const port = initialEvent.ports[0];
      const postMessage = (type: ResponseMessageType, messageID: string, result: any = {}) => {
        const response = { type, messageID, instanceID, result };
        port.postMessage(response, comlink.transferableProperties([response]));
      };

      const sendSuccess = (messageID: string, result: any = {}) => {
        postMessage('success', messageID, result);
      };

      const sendError = (messageID: string, error: Error) => {
        postMessage('error', messageID, createError(error));
      };

      const invokeMethod = async (method: string, args: RequestArgs, messageID: string) => {
        try {
          const result = await (db as any)[method](...args);
          sendSuccess(messageID, result);
        } catch (error) {
          sendError(messageID, error);
        }
      };

      const close = (messageID?: string) => {
        users.set(name, getUserCount(name) - 1);

        db.removeListener('error', uncaughtErrorListener);
        messageIDChangesCleanup.forEach((_value, key) => {
          removeChanges(key);
        });

        if (getUserCount(name) === 0) {
          dbs.delete(name);
          users.delete(name);

          db.close()
            .then(() => {
              if (messageID !== undefined) {
                sendSuccess(messageID);
              }
            })
            .catch((error) => {
              if (messageID !== undefined) {
                sendError(messageID, error);
              }
            });
        } else if (messageID !== undefined) {
          sendSuccess(messageID);
        }

        port.removeEventListener('message', listener);
        port.close();

        dbClosers.delete(close);
      };
      dbClosers.add(close);

      const cleanupChanges = (key: string) => {
        if (getChangesUserCount(key) === 0) {
          const changes = allChanges.get(key);
          if (changes !== undefined) {
            changes.removeAllListeners();
            changes.cancel();
          }
          allChanges.delete(key);
          allChangesUsers.delete(key);
        }
      };

      const removeChanges = (messageID: string) => {
        const key = messageIDKey.get(messageID);
        const cleanup = messageIDChangesCleanup.get(messageID);
        if (key !== undefined && cleanup !== undefined) {
          cleanup();
          allChangesUsers.set(key, getChangesUserCount(key) - 1);
          cleanupChanges(key);

          messageIDKey.delete(messageID);
          messageIDChangesCleanup.delete(messageID);
        }
      };

      const liveChanges = (args: RequestArgs, messageID: string) => {
        const options = args[0];
        const key = stringify(options);
        let changesIn = allChanges.get(key);
        if (changesIn === undefined) {
          changesIn = db.changes(options);
          allChanges.set(key, changesIn);
        }

        const changes = changesIn;
        allChangesUsers.set(key, getChangesUserCount(key) + 1);

        const onChange = (change: any) => {
          postMessage('update', messageID, change);
        };

        const onComplete = (change: any) => {
          sendSuccess(messageID, change);
          removeChanges(messageID);
        };

        const onError = (change: any) => {
          sendError(messageID, change);
          removeChanges(messageID);
        };

        const cleanup = () => {
          changes.removeListener('change', onChange);
          changes.removeListener('complete', onComplete);
          changes.removeListener('error', onError);
        };

        messageIDChangesCleanup.set(messageID, cleanup);
        messageIDKey.set(messageID, key);

        changes.on('change', onChange);
        changes.on('complete', onComplete);
        changes.on('error', onError);
      };

      const cancelChanges = (messageID: string) => {
        removeChanges(messageID);
        sendSuccess(messageID);
      };

      const portListener = (event: MessageEvent) => {
        const message: RequestMessage = event.data;
        switch (message.type) {
          case 'post':
          case 'put':
          case 'putAttachment':
          case 'removeAttachment':
          case 'remove':
          case 'revsDiff':
          case 'compact':
          case 'bulkGet':
          case 'get':
          case 'getAttachment':
          case 'allDocs':
          case 'info':
          case 'id':
          case 'bulkDocs':
          case 'destroy':
          case 'changes':
            invokeMethod(message.type, message.args, message.messageID).catch(() => {
              // do nothing, handled above
            });
            break;
          case 'close':
            close(message.messageID);
            break;
          case 'liveChanges':
            liveChanges(message.args, message.messageID);
            break;
          case 'cancelChanges':
            cancelChanges(message.messageID);
            break;
          case 'construct':
            // do nothing
            break;
          default:
            utils.assertNever(message.type);
        }
      };

      const uncaughtErrorListener = (error: Error) => {
        postMessage('uncaughtError', nanoid(), createError(error));
      };

      port.addEventListener('message', portListener);
      port.start();

      db.on('error', uncaughtErrorListener);
      postMessage('success', constructMessage.messageID);
    } else if (initialEvent.data && initialEvent.data.id && initialEvent.data.type === 'listen') {
      disposers.set(initialEvent.data.id, registerWorkerPouch(initialEvent.ports[0], createPouch));
    } else if (initialEvent.data && initialEvent.data.id && initialEvent.data.type === 'dispose') {
      const disposer = disposers.get(initialEvent.data.id);
      if (disposer !== undefined) {
        disposer.dispose();
        disposers.delete(initialEvent.data.id);
      }
    }
  };

  self.addEventListener('message', listener);
  endpoint.activate(self);

  return {
    dispose: () => {
      self.removeEventListener('message', listener);
      disposers.forEach((disposer) => {
        disposer.dispose();
      });
      dbClosers.forEach((close) => {
        close();
      });
      self.close();
    },
  };
}
