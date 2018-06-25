import { RawSourceMap } from 'source-map';

export interface ProcessErrorOptions {
  readonly message: string;
  readonly sourceMap?: RawSourceMap;
}
