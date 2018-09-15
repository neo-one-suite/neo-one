/// <reference lib="webworker" />
/// <reference types="@types/sharedworker" />
import { FullNode } from './FullNode';

declare var self: SharedWorker.SharedWorkerGlobalScope;

const node = new FullNode();
// tslint:disable-next-line no-let
let startPromise: Promise<void> | undefined;
const start = async () => {
  if (startPromise === undefined) {
    startPromise = node.start();
  }

  return startPromise;
};

// tslint:disable-next-line no-object-mutation
self.onconnect = (connectEvent) => {
  // tslint:disable-next-line no-floating-promises
  start();
  const port = connectEvent.ports[0];
  // tslint:disable-next-line no-object-mutation
  port.onmessage = (event) => {
    const { id, data } = event.data;
    handleEvent(data)
      .then((result) => {
        port.postMessage({ id, type: 'success', data: result });
      })
      .catch((error) => {
        port.postMessage({ id, type: 'failure', data: error.message });
      });
  };
  port.start();
};

// tslint:disable-next-line no-any
const handleEvent = async (data: any) => {
  await start();

  return node.handleRequest(data);
};

// tslint:disable-next-line no-any
const value: () => SharedWorker.SharedWorker = undefined as any;

// tslint:disable-next-line no-default-export export-name
export default value;
