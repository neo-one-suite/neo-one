import localforage from 'localforage';
import { DEFAULT_FILE_OPTS } from './constants';
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
import { AsyncFileSystem, FileOpts, FileStat, SimplePath } from './types';

interface WriteFile {
  readonly type: 'writeFile';
  readonly path: string;
  readonly content: string;
  readonly opts?: FileOpts;
}

interface AddChild {
  readonly type: 'addChild';
  readonly path: string;
  readonly child: string;
}

interface Mkdir {
  readonly type: 'mkdir';
  readonly path: string;
}

type WorkItem = WriteFile | AddChild | Mkdir;

export class LocalForageFileSystem implements AsyncFileSystem {
  private readonly store: typeof localforage;
  private readonly initPromise: Promise<void>;
  // tslint:disable-next-line readonly-array
  private readonly mutableQueue: WorkItem[] = [];
  private mutableRunning = false;

  public constructor(id: string) {
    this.store = localforage.createInstance({ name: id });
    this.initPromise = this.getPath('/').then(async (result) => {
      if (result === undefined) {
        await this.store.setItem('/', { type: 'dir', children: [] });
      }
    });
  }

  public readonly readdir = async (path: string): Promise<ReadonlyArray<string>> => {
    const simplePath = await this.getSimplePath(path);

    return readdir(path, simplePath);
  };

  public readonly stat = async (path: string): Promise<FileStat> => {
    const simplePath = await this.getSimplePath(path);

    return stat(path, simplePath);
  };

  public readonly readFile = async (path: string): Promise<string> => {
    const simplePath = await this.getSimplePath(path);

    return readFile(path, simplePath);
  };

  public readonly readFileOpts = async (path: string): Promise<FileOpts> => {
    const simplePath = await this.getSimplePath(path);

    return readFileOpts(path, simplePath);
  };

  public readonly writeFile = async (pathIn: string, content: string, opts?: FileOpts): Promise<void> => {
    const path = normalizePath(pathIn);
    await this.process({
      type: 'writeFile',
      path,
      content,
      opts,
    });
    await this.addParent(path);
  };

  public readonly writeFileOpts = async (pathIn: string, opts: FileOpts): Promise<void> => {
    const path = normalizePath(pathIn);
    const simplePath = await this.getSimplePath(path);
    const simpleFile = checkWriteFile(path, simplePath);

    await this.process({
      type: 'writeFile',
      path,
      content: simpleFile === undefined ? '' : simpleFile.content,
      opts,
    });
    await this.addParent(path);
  };

  public readonly mkdir = async (pathIn: string): Promise<void> => {
    const path = normalizePath(pathIn);
    await this.process({ type: 'mkdir', path });
    await this.addParent(path);
  };

  private async getSimplePath(pathIn: string) {
    await this.initPromise;
    const path = normalizePath(pathIn);

    return this.getPath(path);
  }

  private async addParent(path: string): Promise<void> {
    const result = getParentPaths(path);
    if (result !== undefined) {
      const [parentPath, childPath] = result;

      await this.process({ type: 'addChild', path: parentPath, child: childPath });
    }
  }

  private async process(workItem: WorkItem): Promise<void> {
    this.mutableQueue.push(workItem);

    if (this.mutableRunning) {
      return;
    }

    this.mutableRunning = true;

    let item = this.mutableQueue.shift();
    // tslint:disable-next-line no-loop-statement
    while (item !== undefined) {
      switch (item.type) {
        case 'writeFile':
          let { opts } = item;
          if (opts === undefined) {
            const simplePath = await this.getSimplePath(item.path);
            const simpleFile = checkWriteFile(item.path, simplePath);

            opts = simpleFile === undefined ? DEFAULT_FILE_OPTS : simpleFile.opts;
          }

          await this.store.setItem(item.path, {
            type: 'file',
            content: item.content,
            opts,
          });
          break;
        case 'addChild':
          const parentDir = await this.getSimplePath(item.path);
          if (parentDir === undefined || parentDir.type !== 'dir') {
            throw new Error(
              `Something went wrong, found parentDir: ${
                parentDir === undefined ? 'undefined' : parentDir.type
              }. For path: ${item.path}.`,
            );
          }
          if (!parentDir.children.includes(item.child)) {
            await this.store.setItem(item.path, {
              ...parentDir,
              // tslint:disable-next-line no-array-mutation
              children: parentDir.children.concat([item.child]).sort(),
            });
          }
          break;
        case 'mkdir':
          const path = normalizePath(item.path);
          const simplePathDir = await this.getSimplePath(path);
          checkMkdir(path, simplePathDir);

          await this.store.setItem(item.path, { type: 'dir', children: [] });
          break;
        default:
        // do nothing
      }

      item = this.mutableQueue.shift();
    }

    this.mutableRunning = false;
  }

  private async getPath(path: string): Promise<SimplePath | undefined> {
    try {
      const result = await this.store.getItem<SimplePath | null | undefined>(path);

      return result == undefined ? undefined : result;
    } catch {
      return undefined;
    }
  }
}
