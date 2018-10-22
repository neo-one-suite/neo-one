import { FileSystemWorker } from './FileSystemWorker';
import { DisposableEndpoint } from './types';

export class FileSystemManager {
  public readonly worker: Worker;

  public constructor() {
    this.worker = FileSystemWorker();
  }

  public getEndpoint(): DisposableEndpoint {
    const { port1, port2 } = new MessageChannel();

    let instanceID: string | undefined;
    const workerListener = (event: MessageEvent) => {
      if (event.data && event.data.id && event.data.id === instanceID) {
        port1.postMessage(event.data);
      }
    };
    this.worker.addEventListener('message', workerListener);

    const changesIDs = new Set<string>();
    port1.addEventListener('message', (event) => {
      if (event.data && event.data.id && instanceID === undefined) {
        instanceID = event.data.id;
      }
      if (event.data && event.data.messageId && event.data.type === 'liveChanges') {
        changesIDs.add(event.data.messageId);
      }
      this.worker.postMessage(event.data);
    });
    port1.start();

    return {
      endpoint: port2,
      dispose: () => {
        this.worker.removeEventListener('message', workerListener);
        port1.close();
        changesIDs.forEach((changeID) => {
          this.worker.postMessage({ id: instanceID, args: [], messageId: changeID, type: 'cancelChanges' });
        });
      },
    };
  }
}
