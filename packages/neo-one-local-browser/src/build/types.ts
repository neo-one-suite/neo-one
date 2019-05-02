import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { RawSourceMap } from 'source-map';

export type ContractResult = Omit<CompileContractResult, 'sourceMap'> & {
  readonly filePath: string;
  readonly name: string;
  readonly sourceMap: RawSourceMap;
};

export type CommonCodeContract = ContractResult & {
  readonly addresses: readonly string[];
};

export interface BuildFile {
  readonly path: string;
  readonly content: string;
}

export type BuildFiles = readonly BuildFile[];
