import { sep } from './constants';
import { SubscribableSyncFileSystem } from './SubscribableSyncFileSystem';
import { AsyncFileSystem, FileStat, FileSystem } from './types';

export class MirrorFileSystem extends SubscribableSyncFileSystem implements FileSystem {
  public static async create<T extends MirrorFileSystem>(syncFS: FileSystem, asyncFS: AsyncFileSystem): Promise<T> {
    async function readWorker(pathIn: string): Promise<void> {
      if (pathIn !== '/') {
        syncFS.mkdirSync(pathIn);
      }
      const paths = await asyncFS.readdir(pathIn);
      await Promise.all(
        paths.map(async (file) => {
          const path = (pathIn === '/' ? '' : pathIn) + sep + file;
          const stat = await asyncFS.stat(path);
          if (stat.isFile()) {
            const content = await asyncFS.readFile(path);
            syncFS.writeFileSync(path, content);
          } else if (stat.isDirectory()) {
            await readWorker(path);
          }
        }),
      );
    }

    await readWorker('/');

    // tslint:disable-next-line no-any
    return new (this as any)(syncFS, asyncFS);
  }

  protected constructor(protected readonly syncFS: FileSystem, private readonly asyncFS: AsyncFileSystem) {
    super();
  }

  public readonly readdirSync = (path: string): ReadonlyArray<string> => this.syncFS.readdirSync(path);
  public readonly statSync = (path: string): FileStat => this.syncFS.statSync(path);
  public readonly readFileSync = (path: string): string => this.syncFS.readFileSync(path);

  protected writeFileSyncInternal(path: string, contents: string): void {
    this.syncFS.writeFileSync(path, contents);
    this.asyncFS.writeFile(path, contents).catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  }
  protected mkdirSyncInternal(path: string): void {
    this.syncFS.mkdirSync(path);
    this.asyncFS.mkdir(path).catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  }
}
