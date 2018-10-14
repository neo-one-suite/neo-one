import { utils } from '@neo-one/utils';
import * as nodePath from 'path';
import { DEFAULT_FILE_OPTS } from './constants';
import { Disposable, FileOpts, FileSystemChange, SimpleFile, SubscribableFileSystem, Subscriber } from './types';
import { ensureDir } from './utils';

export abstract class SubscribableSyncFileSystem implements SubscribableFileSystem {
  private mutableID = 0;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableSubscribers: { [id: number]: Subscriber | undefined } = {};

  public readonly writeFileSync = (path: string, content: string, optsIn?: FileOpts): void => {
    let opts = optsIn;
    if (opts === undefined) {
      try {
        opts = this.readFileOptsSync(path);
      } catch {
        opts = DEFAULT_FILE_OPTS;
      }
    }
    this.writeFileSyncInternal(path, content, opts);
    this.emitChange({ type: 'writeFile', path, content, opts });
  };

  public readonly writeFileOptsSync = (path: string, opts: FileOpts): void => {
    const file = this.writeFileOptsSyncInternal(path, opts);
    this.emitChange({ ...file, type: 'writeFile', path });
  };

  public readonly mkdirSync = (path: string): void => {
    this.mkdirSyncInternal(path);
    this.emitChange({ type: 'mkdir', path });
  };

  public readonly subscribe = (subscriber: Subscriber): Disposable => {
    const id = this.mutableID;
    this.mutableID += 1;
    this.mutableSubscribers[id] = subscriber;

    return {
      dispose: () => {
        this.mutableSubscribers[id] = undefined;
      },
    };
  };

  public readonly handleChange = async (change: FileSystemChange) => {
    switch (change.type) {
      case 'writeFile':
        const { path, content, opts } = change;
        ensureDir(this, nodePath.dirname(path));
        this.writeFileSync(path, content, opts);
        break;
      case 'mkdir':
        ensureDir(this, nodePath.dirname(change.path));
        this.mkdirSync(change.path);
        break;
      default:
        utils.assertNever(change);
        throw new Error('For TS');
    }
  };

  protected abstract writeFileSyncInternal(path: string, content: string, opts: FileOpts): void;
  protected abstract writeFileOptsSyncInternal(path: string, opts: FileOpts): SimpleFile;
  protected abstract mkdirSyncInternal(path: string): void;
  protected abstract readFileOptsSync(path: string): FileOpts;

  protected emitChange(change: FileSystemChange): void {
    Object.values(this.mutableSubscribers).forEach((subscriber) => {
      if (subscriber !== undefined) {
        subscriber(change);
      }
    });
  }
}
