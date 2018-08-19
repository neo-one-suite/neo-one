import { RawSourceMap } from 'source-map';

export interface SourceMaps {
  readonly [address: string]: RawSourceMap;
}
