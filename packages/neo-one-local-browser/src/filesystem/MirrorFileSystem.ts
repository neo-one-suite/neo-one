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

  private readonly promises = new Set<Promise<void>>();

  protected constructor(protected readonly syncFS: FileSystem, private readonly asyncFS: AsyncFileSystem) {
    super();
  }

  public readonly readdirSync = (path: string): ReadonlyArray<string> => this.syncFS.readdirSync(path);
  public readonly statSync = (path: string): FileStat => this.syncFS.statSync(path);
  public readonly readFileSync = (path: string): string => this.syncFS.readFileSync(path);

  public async sync(): Promise<void> {
    await Promise.all([...this.promises]);
  }

  protected writeFileSyncInternal(path: string, contents: string): void {
    this.syncFS.writeFileSync(path, contents);
    this.handlePromise(this.asyncFS.writeFile(path, contents));
  }
  protected mkdirSyncInternal(path: string): void {
    this.syncFS.mkdirSync(path);
    this.handlePromise(this.asyncFS.mkdir(path));
  }

  private handlePromise(promise: Promise<void>): void {
    this.promises.add(promise);
    promise
      .then(() => {
        this.promises.delete(promise);
      })
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }
}
