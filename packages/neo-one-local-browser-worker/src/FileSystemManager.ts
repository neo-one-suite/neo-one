import nanoid from 'nanoid';
import { FileSystemWorker } from './FileSystemWorker';
import { DisposableEndpoint } from './types';

export class FileSystemManager {
  public readonly worker: Worker;

  public constructor() {
    this.worker = FileSystemWorker();
  }

  public getEndpoint(): DisposableEndpoint {
    const { port1, port2 } = new MessageChannel();
    const id = nanoid();
    this.worker.postMessage({ type: 'listen', id }, [port1]);

    return {
      endpoint: port2,
      dispose: () => {
        this.worker.postMessage({ type: 'dispose', id });
      },
    };
  }
}
