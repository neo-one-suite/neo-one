import { JSONRPCProvider, JSONRPCRequest, JSONRPCResponse } from '@neo-one/client';
// tslint:disable-next-line match-default-export-name
import NodeWorker from './worker.shared-worker';

// tslint:disable-next-line no-let
let worker: SharedWorker.SharedWorker | undefined;

const getWorker = (): SharedWorker.SharedWorker => {
  if (worker === undefined) {
    worker = NodeWorker();
    worker.port.start();
  }

  return worker;
};

// tslint:disable-next-line no-let
let currentID = 0;

const getID = () => {
  const id = currentID;
  currentID += 1;

  return id;
};

export class JSONRPCLocalProvider extends JSONRPCProvider {
  public async request(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    const id = getID();

    const result = new Promise<JSONRPCResponse>((resolve, reject) => {
      const cleanup = () => {
        getWorker().port.removeEventListener('message', onMessage);
      };

      const onMessage = (event: MessageEvent) => {
        const { id: messageID, type, data } = event.data;
        if (id === messageID) {
          if (type === 'failure') {
            cleanup();
            reject(new Error(data));
          } else {
            cleanup();
            resolve(this.handleResponse(data));
          }
        }
      };

      getWorker().port.addEventListener('message', onMessage);
    });

    getWorker().port.postMessage({
      id,
      data: {
        ...req,
        jsonrpc: '2.0',
        id: 1,
        method: req.method,
        params: req.watchTimeoutMS === undefined ? req.params : req.params.concat([req.watchTimeoutMS]),
      },
    });

    return result;
  }
}
