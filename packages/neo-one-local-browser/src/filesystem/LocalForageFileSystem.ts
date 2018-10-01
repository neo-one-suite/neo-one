import localforage from 'localforage';
import {
  checkMkdir,
  checkWriteFile,
  getParentPaths,
  normalizePath,
  readdir,
  readFile,
  stat,
} from './keyValueFileSystem';
import { AsyncFileSystem, FileStat, SimplePath } from './types';

interface WriteFile {
  readonly type: 'writeFile';
  readonly path: string;
  readonly content: string;
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

  public readonly readdir = async (pathIn: string): Promise<ReadonlyArray<string>> => {
    await this.initPromise;
    const path = normalizePath(pathIn);
    const simplePath = await this.getPath(path);

    return readdir(path, simplePath);
  };

  public readonly stat = async (pathIn: string): Promise<FileStat> => {
    await this.initPromise;
    const path = normalizePath(pathIn);
    const simplePath = await this.getPath(path);

    return stat(path, simplePath);
  };

  public readonly readFile = async (pathIn: string): Promise<string> => {
    await this.initPromise;
    const path = normalizePath(pathIn);
    const simplePath = await this.getPath(path);

    return readFile(path, simplePath);
  };

  public readonly writeFile = async (pathIn: string, content: string): Promise<void> => {
    await this.initPromise;
    const path = normalizePath(pathIn);
    const simplePath = await this.getPath(path);
    checkWriteFile(path, simplePath);

    await this.process({ type: 'writeFile', path, content });
    await this.addParent(path);
  };

  public readonly mkdir = async (pathIn: string): Promise<void> => {
    await this.initPromise;
    const path = normalizePath(pathIn);
    const simplePath = await this.getPath(path);
    checkMkdir(path, simplePath);

    await this.process({ type: 'mkdir', path });
    await this.addParent(path);
  };

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
          await this.store.setItem(item.path, { type: 'file', content: item.content });
          break;
        case 'addChild':
          const parentDir = await this.getPath(item.path);
          if (parentDir === undefined || parentDir.type !== 'dir') {
            throw new Error('Something went wrong');
          }
          await this.store.setItem(item.path, {
            ...parentDir,
            // tslint:disable-next-line no-array-mutation
            children: parentDir.children.concat([item.child]).sort(),
          });
          break;
        case 'mkdir':
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
