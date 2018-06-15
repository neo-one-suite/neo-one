import { Writable } from 'stream';
import { WriteStream } from 'fs';

export class File extends WriteStream {
  constructor({ downloadID, key }: { downloadID: string; key: string });
  download(): void;
  loadAttributes(func: Function): void;
}
export class Storage {
  constructor({ email, password, autologin }: { email: string; password: string; autologin: boolean });
  login(callback: Function): void;
  upload(file: string): Writable;
}
