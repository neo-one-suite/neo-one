import { utils } from '@neo-one/utils';
import { MirrorFileSystem } from './MirrorFileSystem';
import { Disposable, FileSystemChange, SubscribableFileSystem } from './types';

export class WorkerMirrorFileSystem extends MirrorFileSystem {
  public static subscribe(fs: SubscribableFileSystem, worker: Worker): Disposable {
    return fs.subscribe((change) => worker.postMessage({ fsChange: true, change }));
  }

  public readonly handleMessage = (event: MessageEvent, fallback: (event: MessageEvent) => void) => {
    if (event.data.fsChange) {
      const change: FileSystemChange = event.data.change;
      switch (change.type) {
        case 'writeFile':
          this.syncFS.writeFileSync(change.path, change.content);
          break;
        case 'mkdir':
          this.syncFS.mkdirSync(change.path);
          break;
        default:
          utils.assertNever(change);
          throw new Error('For TS');
      }
    } else {
      fallback(event);
    }
  };
}
