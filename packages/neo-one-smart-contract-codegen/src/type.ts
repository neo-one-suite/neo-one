import { RawSourceMap } from 'source-map';

export interface ContractPaths {
  readonly name: string;
  readonly addresses: readonly string[];
  readonly sourceMap: RawSourceMap;
  readonly contractPath: string;
  readonly createContractPath: string;
  readonly abiPath: string;
  readonly typesPath: string;
}

export interface FileResult {
  readonly ts: string;
  readonly js?: string;
}

export type CodegenFramework = 'none' | 'react' | 'angular' | 'vue';
