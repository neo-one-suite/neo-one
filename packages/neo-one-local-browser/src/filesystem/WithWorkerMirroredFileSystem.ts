import { utils } from '@neo-one/utils';
import * as nodePath from 'path';
import { MirrorFileSystem } from './MirrorFileSystem';
import { AsyncFileSystem, FileSystem, FileSystemChange } from './types';
import { ensureDir } from './utils';

export class WithWorkerMirroredFileSystem {
  protected readonly fs: Promise<MirrorFileSystem>;

  public constructor(private readonly syncFS: FileSystem, asyncFS: AsyncFileSystem) {
    this.fs = MirrorFileSystem.create(syncFS, asyncFS);
  }

  public readonly onFileSystemChange = async (change: FileSystemChange) =>
    this.fs.then(() => {
      switch (change.type) {
        case 'writeFile':
          ensureDir(this.syncFS, nodePath.dirname(change.path));
          this.syncFS.writeFileSync(change.path, change.content);
          break;
        case 'mkdir':
          ensureDir(this.syncFS, nodePath.dirname(change.path));
          this.syncFS.mkdirSync(change.path);
          break;
        default:
          utils.assertNever(change);
          throw new Error('For TS');
      }
    });
}
