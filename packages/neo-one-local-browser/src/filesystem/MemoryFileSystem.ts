import {
  checkMkdir,
  checkWriteFile,
  getParentPaths,
  normalizePath,
  readdir,
  readFile,
  stat,
} from './keyValueFileSystem';
import { SubscribableSyncFileSystem } from './SubscribableSyncFileSystem';
import { FileStat, FileSystem, SimplePath } from './types';

export class MemoryFileSystem extends SubscribableSyncFileSystem implements FileSystem {
  // tslint:disable-next-line readonly-keyword
  private readonly mutablePaths: { [path: string]: SimplePath } = { '/': { type: 'dir', children: [] } };

  public readonly readdirSync = (pathIn: string): ReadonlyArray<string> => {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);

    return readdir(path, simplePath);
  };

  public readonly statSync = (pathIn: string): FileStat => {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);

    return stat(path, simplePath);
  };

  public readonly readFileSync = (pathIn: string): string => {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);

    return readFile(path, simplePath);
  };

  protected writeFileSyncInternal(pathIn: string, content: string): void {
    const path = normalizePath(pathIn);
    const simplePath = this.getPath(path);
    checkWriteFile(path, simplePath);

    this.mutablePaths[path] = { type: 'file', content };
    this.addParent(path);
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

      this.mutablePaths[parentPath] = {
        ...parentDir,
        // tslint:disable-next-line no-array-mutation
        children: parentDir.children.concat([childPath]).sort(),
      };
    }
  }

  private getPath(path: string): SimplePath | undefined {
    return this.mutablePaths[path];
  }
}
