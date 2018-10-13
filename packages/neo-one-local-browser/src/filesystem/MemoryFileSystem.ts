import {
  checkMkdir,
  checkWriteFile,
  getParentPaths,
  normalizePath,
  readdir,
  readFile,
  readFileOpts,
  stat,
} from './keyValueFileSystem';
import { SubscribableSyncFileSystem } from './SubscribableSyncFileSystem';
import { FileOpts, FileStat, FileSystem, SimpleFile, SimplePath } from './types';

export class MemoryFileSystem extends SubscribableSyncFileSystem implements FileSystem {
  // tslint:disable-next-line readonly-keyword
  private readonly mutablePaths: { [path: string]: SimplePath } = { '/': { type: 'dir', children: [] } };

  public readonly readdirSync = (path: string): ReadonlyArray<string> => readdir(path, this.getSimplePath(path));

  public readonly statSync = (path: string): FileStat => stat(path, this.getSimplePath(path));

  public readonly readFileSync = (path: string): string => readFile(path, this.getSimplePath(path));
  public readonly readFileOptsSync = (path: string): FileOpts => readFileOpts(path, this.getSimplePath(path));

  protected writeFileSyncInternal(pathIn: string, content: string, opts: FileOpts): void {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);
    checkWriteFile(path, simplePath);

    const file: SimpleFile = {
      type: 'file',
      content,
      opts,
    };
    this.mutablePaths[path] = file;
    this.addParent(path);
  }

  protected writeFileOptsSyncInternal(pathIn: string, opts: FileOpts): SimpleFile {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);
    const simpleFile = checkWriteFile(path, simplePath);

    const file: SimpleFile = {
      type: 'file',
      content: simpleFile === undefined ? '' : simpleFile.content,
      opts,
    };
    this.mutablePaths[path] = file;
    this.addParent(path);

    return file;
  }

  protected mkdirSyncInternal(pathIn: string): void {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);
    checkMkdir(path, simplePath);

    this.mutablePaths[path] = { type: 'dir', children: [] };
    this.addParent(path);
  }

  private addParent(path: string): void {
    const result = getParentPaths(path);
    if (result !== undefined) {
      const [parentPath, childPath] = result;
      const parentDir = this.mutablePaths[parentPath] as SimplePath | undefined;
      if (parentDir === undefined || parentDir.type !== 'dir') {
        throw new Error(`Something went wrong, could not find path: ${parentPath}`);
      }

      if (!parentDir.children.includes(childPath)) {
        this.mutablePaths[parentPath] = {
          ...parentDir,
          // tslint:disable-next-line no-array-mutation
          children: parentDir.children.concat([childPath]).sort(),
        };
      }
    }
  }

  private getSimplePath(pathIn: string) {
    const path = normalizePath(pathIn);

    return this.getPath(path);
  }

  private getPath(path: string): SimplePath | undefined {
    return this.mutablePaths[path];
  }
}
