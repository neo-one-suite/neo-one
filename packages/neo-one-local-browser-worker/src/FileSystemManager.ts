import { comlink } from '@neo-one/worker';
import { FileSystemWorker } from './FileSystemWorker';

export class FileSystemManager {
  public readonly worker: Worker;

  public constructor() {
    this.worker = FileSystemWorker();
  }

  public getEndpoint(): comlink.Endpoint {
    const { port1, port2 } = new MessageChannel();
    const instanceIDs = new Set<string>();
    const workerListener = (event: MessageEvent) => {
      if (event.data && event.data.id && instanceIDs.has(event.data.id)) {
        port1.postMessage(event.data);
      }
    };
    port1.addEventListener('message', (event) => {
      if (event.data && event.data.id) {
        instanceIDs.add(event.data.id);
      }
      this.worker.addEventListener('message', workerListener);
      this.worker.postMessage(event.data);
    });
    port1.start();

    return port2;
  }
}
