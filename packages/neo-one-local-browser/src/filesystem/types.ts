// tslint:disable no-method-signature no-any

export interface FileStat {
  readonly isFile: () => boolean;
  readonly isDirectory: () => boolean;
}

export interface WriteFileFileSystemChange {
  readonly type: 'writeFile';
  readonly path: string;
  readonly content: string;
  readonly opts: FileOpts;
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
  readonly writeFileSync: (path: string, content: string, opts?: FileOpts) => void;
  readonly mkdirSync: (path: string) => void;
  readonly subscribe: (subscriber: Subscriber) => Disposable;
}

export interface FileSystem extends SubscribableFileSystem {
  readonly readdirSync: (path: string) => ReadonlyArray<string>;
  readonly statSync: (path: string) => FileStat;
  readonly readFileSync: (path: string) => string;
  readonly writeFileSync: (path: string, content: string, opts?: FileOpts) => void;
  readonly mkdirSync: (path: string) => void;
  readonly readFileOptsSync: (path: string) => FileOpts;
  readonly writeFileOptsSync: (path: string, opts: FileOpts) => void;
}

export interface AsyncFileSystem {
  readonly readdir: (path: string) => Promise<ReadonlyArray<string>>;
  readonly stat: (path: string) => Promise<FileStat>;
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string, opts?: FileOpts) => Promise<void>;
  readonly mkdir: (path: string) => Promise<void>;
  readonly readFileOpts: (path: string) => Promise<FileOpts>;
  readonly writeFileOpts: (path: string, opts: FileOpts) => Promise<void>;
}

export interface RemoteFileSystem {
  readonly handleChange: (change: FileSystemChange) => Promise<void>;
  readonly writeFileSync: (path: string, content: string, opts?: FileOpts) => Promise<void>;
  readonly mkdirSync: (path: string) => Promise<void>;
}

export interface FileOpts {
  readonly writable: boolean;
}

export interface SimpleDir {
  readonly type: 'dir';
  // tslint:disable-next-line readonly-array
  readonly children: string[];
}

export interface SimpleFile {
  readonly type: 'file';
  readonly content: string;
  readonly opts: FileOpts;
}

export type SimplePath = SimpleDir | SimpleFile;
