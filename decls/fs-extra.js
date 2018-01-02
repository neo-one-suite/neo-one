/* @flow */
import type { Stats } from "fs";

declare module 'fs-extra' {
  declare export interface PathEntry {
      path: string;
      stats: Stats;
  }

  declare export interface PathEntryStream {
      read(): PathEntry | null;
  }

  declare export type CopyFilter = (src: string, dest: string) => boolean;

  declare export type SymlinkType = "dir" | "file";

  declare export interface CopyOptions {
      dereference?: boolean;
      overwrite?: boolean;
      preserveTimestamps?: boolean;
      errorOnExist?: boolean;
      filter?: CopyFilter;
      recursive?: boolean;
  }

  declare export interface MoveOptions {
      overwrite?: boolean;
      limit?: number;
  }

  declare export interface ReadOptions {
      throws?: boolean;
      fs?: Object;
      reviver?: any;
      encoding?: string;
      flag?: string;
  }

  declare export type WriteFileOptions = {|
      encoding?: string;
      flag?: string;
      mode?: number;
  |}

  declare export type WriteOptions = {|
      ...WriteFileOptions,
      fs?: Object;
      replacer?: any;
      spaces?: number | string;
  |}

  declare export interface ReadResult {
      bytesRead: number;
      buffer: Buffer;
  }

  declare export interface WriteResult {
      bytesWritten: number;
      buffer: Buffer;
  }

  declare function readFile(file: string | Buffer | number, options: { flag?: string; } | { encoding: string; flag?: string; }): Promise<string>;
  declare function readFile(file: string | Buffer | number, encoding: string): Promise<string>;
  declare function readFile(file: string | Buffer | number): Promise<Buffer>;
  declare function readFileSync(file: string | Buffer | number, options: { flag?: string; } | { encoding: string; flag?: string; }): string;
  declare function readFileSync(file: string | Buffer | number, encoding: string): string;
  declare function readFileSync(file: string | Buffer | number): Buffer;

  declare module.exports: {
    constants: Object,
    copy(src: string, dest: string, options?: CopyOptions): Promise<void>;
    copySync(src: string, dest: string, options?: CopyOptions): void;

    move(src: string, dest: string, options?: MoveOptions): Promise<void>;
    moveSync(src: string, dest: string, options?: MoveOptions): void;

    createFile(file: string): Promise<void>;
    createFileSync(file: string): void;

    ensureDir(path: string): Promise<void>;
    ensureDirSync(path: string): void;

    mkdirs(dir: string): Promise<void>;
    mkdirp(dir: string): Promise<void>;
    mkdirsSync(dir: string): void;
    mkdirpSync(dir: string): void;

    outputFile(file: string, data: any, options?: WriteFileOptions | string): Promise<void>;
    outputFileSync(file: string, data: any, options?: WriteFileOptions | string): void;

    readJson(file: string, options?: ReadOptions): Promise<any>;
    readJSON(file: string, options?: ReadOptions): Promise<any>;

    readJsonSync(file: string, options?: ReadOptions): any;
    readJSONSync(file: string, options?: ReadOptions): any;

    remove(dir: string): Promise<void>;
    removeSync(dir: string): void;

    outputJSON(file: string, data: any, options?: WriteOptions): Promise<void>;
    outputJson(file: string, data: any, options?: WriteOptions): Promise<void>;
    outputJsonSync(file: string, data: any, options?: WriteOptions): void;
    outputJSONSync(file: string, data: any, options?: WriteOptions): void;

    writeJSON(file: string, object: any, options?: WriteOptions): Promise<void>;
    writeJson(file: string, object: any, options?: WriteOptions): Promise<void>;

    writeJsonSync(file: string, object: any, options?: WriteOptions): void;
    writeJSONSync(file: string, object: any, options?: WriteOptions): void;

    ensureFile(path: string): Promise<void>;
    ensureFileSync(path: string): void;

    ensureLink(src: string, dest: string): Promise<void>;
    ensureLinkSync(src: string, dest: string): void;

    ensureSymlink(src: string, dest: string, type?: SymlinkType): Promise<void>;
    ensureSymlinkSync(src: string, dest: string, type?: SymlinkType): void;

    emptyDir(path: string): Promise<void>;
    emptyDirSync(path: string): void;

    pathExists(path: string): Promise<boolean>;
    pathExistsSync(path: string): boolean;

    // fs async methods
    // copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v6/index.d.ts

    access(path: string | Buffer, mode?: number): Promise<void>;

    appendFile(file: string | Buffer | number, data: any, options?: { encoding?: string; mode?: number | string; flag?: string; }): Promise<void>;

    chmod(path: string | Buffer, mode: string | number): Promise<void>;

    chown(path: string | Buffer, uid: number, gid: number): Promise<void>;

    close(fd: number): Promise<void>;

    fchmod(fd: number, mode: string | number): Promise<void>;

    fchown(fd: number, uid: number, gid: number): Promise<void>;

    fdatasync(fd: number): Promise<void>;

    fstat(fd: number): Promise<Stats>;

    fsync(fd: number): Promise<void>;

    ftruncate(fd: number, len?: number): Promise<void>;

    futimes(fd: number, atime: number, mtime: number): Promise<void>;
    futimes(fd: number, atime: Date, mtime: Date): Promise<void>;

    lchown(path: string | Buffer, uid: number, gid: number): Promise<void>;

    link(srcpath: string | Buffer, dstpath: string | Buffer): Promise<void>;

    lstat(path: string | Buffer): Promise<Stats>;

    mkdir(path: string | Buffer): Promise<void>;

    open(path: string | Buffer, flags: string | number, mode?: number): Promise<number>;

    read(fd: number, buffer: Buffer, offset: number, length: number, position: number | null): Promise<ReadResult>;

    readFile: typeof readFile;
    readFileSync: typeof readFileSync;

    readdir(path: string | Buffer): Promise<Array<string>>;
    readdirSync(path: string | Buffer): Array<string>;

    readlink(path: string | Buffer): Promise<string>;

    realpath(path: string | Buffer, cache?: { [path: string]: string }): Promise<string>;

    rename(oldPath: string, newPath: string): Promise<void>;

    rmdir(path: string | Buffer): Promise<void>;

    stat(path: string | Buffer): Promise<Stats>;

    symlink(srcpath: string | Buffer, dstpath: string | Buffer, type?: string): Promise<void>;

    truncate(path: string | Buffer, len?: number): Promise<void>;

    unlink(path: string | Buffer): Promise<void>;

    utimes(path: string | Buffer, atime: number, mtime: number): Promise<void>;
    utimes(path: string | Buffer, atime: Date, mtime: Date): Promise<void>;

    write(fd: number, buffer: Buffer, offset: number, length: number, position?: number | null): Promise<WriteResult>;
    write(fd: number, data: any, offset: number, encoding?: string): Promise<WriteResult>;

    writeFile(file: string | Buffer | number, data: any, options?: WriteFileOptions | string): Promise<void>;
    writeFileSync(file: string | Buffer | number, data: any, options?: WriteFileOptions | string): void;

    mkdtemp(prefix: string): Promise<string>;
  }
}
