import { Readable, Writable } from 'stream';

export class Storage {
  constructor(options: { email: string; password: string; autologin: boolean });
  login(cb: (error: Error | undefined) => void): void;
  upload(file: string): Writable;
}

export class File {
  constructor(options: { downloadID: string; key: string });
  loadAttributes(cb: (error: Error | undefined) => void): void;
  download(): Readable;
}
