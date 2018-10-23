import { FileSystemWorker } from './FileSystemWorker';
import { DisposableEndpoint } from './types';

export class FileSystemManager {
  public readonly worker: Worker;

  public constructor() {
    this.worker = FileSystemWorker();
  }

  public getEndpoint(): DisposableEndpoint {
    const { port1, port2 } = new MessageChannel();

    const messageIDs = new Set<string>();

    const workerListener = (event: MessageEvent) => {
      if (event.data && event.data.id && messageIDs.has(event.data.messageId)) {
        messageIDs.delete(event.data.messageId);
        port1.postMessage(event.data);
      }
    };
    this.worker.addEventListener('message', workerListener);

    const changesIDs = new Set<{ instanceID: string; messageID: string }>();
    port1.addEventListener('message', (event) => {
      if (event.data && event.data.messageId && event.data.type === 'liveChanges') {
        changesIDs.add({ instanceID: event.data.id, messageID: event.data.messageId });
      }
      if (event.data && event.data.messageId) {
        messageIDs.add(event.data.messageId);
      }
      this.worker.postMessage(event.data);
    });
    port1.start();

    return {
      endpoint: port2,
      dispose: () => {
        this.worker.removeEventListener('message', workerListener);
        port1.close();
        changesIDs.forEach(({ instanceID, messageID }) => {
          this.worker.postMessage({ id: instanceID, args: [], messageId: messageID, type: 'cancelChanges' });
        });
      },
    };
  }
}
