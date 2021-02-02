import { RawSourceMap } from 'source-map';

export interface ContractPaths {
  readonly name: string;
  readonly sourceMap: RawSourceMap;
  readonly contractPath: string;
  readonly createContractPath: string;
  readonly manifestPath: string;
  readonly typesPath: string;
}

export interface FileResult {
  readonly ts: string;
  readonly js?: string;
}
