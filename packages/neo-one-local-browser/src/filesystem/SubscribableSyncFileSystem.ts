import { Disposable, FileSystemChange, SubscribableFileSystem, Subscriber } from './types';

export abstract class SubscribableSyncFileSystem implements SubscribableFileSystem {
  private mutableID = 0;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableSubscribers: { [id: number]: Subscriber | undefined } = {};

  public readonly writeFileSync = (path: string, content: string): void => {
    this.writeFileSyncInternal(path, content);
    this.emitChange({ type: 'writeFile', path, content });
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

  protected abstract writeFileSyncInternal(path: string, content: string): void;
  protected abstract mkdirSyncInternal(path: string): void;

  protected emitChange(change: FileSystemChange): void {
    Object.values(this.mutableSubscribers).forEach((subscriber) => {
      if (subscriber !== undefined) {
        subscriber(change);
      }
    });
  }
}
