// tslint:disable no-method-signature no-any

export interface FileStat {
  readonly isFile: () => boolean;
  readonly isDirectory: () => boolean;
}

export interface WriteFileFileSystemChange {
  readonly type: 'writeFile';
  readonly path: string;
  readonly content: string;
}

export interface MkdirFileSystemChange {
  readonly type: 'mkdir';
  readonly path: string;
}

export type FileSystemChange = WriteFileFileSystemChange | MkdirFileSystemChange;

export type Subscriber = (change: FileSystemChange) => void;

export interface Disposable {
  readonly dispose: () => void;
}

export interface SubscribableFileSystem {
  readonly subscribe: (subscriber: Subscriber) => Disposable;
}

export interface FileSystem extends SubscribableFileSystem {
  readonly readdirSync: (path: string) => ReadonlyArray<string>;
  readonly statSync: (path: string) => FileStat;
  readonly readFileSync: (path: string) => string;
  readonly writeFileSync: (path: string, content: string) => void;
  readonly mkdirSync: (path: string) => void;
}

export interface AsyncFileSystem {
  readonly readdir: (path: string) => Promise<ReadonlyArray<string>>;
  readonly stat: (path: string) => Promise<FileStat>;
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly mkdir: (path: string) => Promise<void>;
}

export interface SimpleDir {
  readonly type: 'dir';
  // tslint:disable-next-line readonly-array
  readonly children: string[];
}

export interface SimpleFile {
  readonly type: 'file';
  readonly content: string;
}

export type SimplePath = SimpleDir | SimpleFile;
