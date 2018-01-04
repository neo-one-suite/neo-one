/* @flow */
import { type Readable } from 'stream';

export type LevelUpChange =
  | {| type: 'put', key: Buffer, value: Buffer |}
  | {| type: 'del', key: Buffer |};
export type StreamOptions = {|
  gte?: Buffer,
  lte?: Buffer,
|};
export type LevelUp = {
  get: (key: Buffer) => Promise<Buffer>,
  close: () => Promise<void>,
  batch: (changes: Array<LevelUpChange>) => Promise<void>,
  createValueStream: (options: StreamOptions) => Readable,
};
