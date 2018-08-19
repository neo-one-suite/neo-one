import { RawSourceMap } from 'source-map';

export interface ContractPaths {
  readonly name: string;
  readonly addresses: ReadonlyArray<string>;
  readonly sourceMap: RawSourceMap;
  readonly contractPath: string;
  readonly typesPath: string;
}
