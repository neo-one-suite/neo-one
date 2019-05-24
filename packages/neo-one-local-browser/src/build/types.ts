import { CompileContractResult } from '@neo-one/smart-contract-compiler';
import { OmitStrict } from '@neo-one/utils';
import { RawSourceMap } from 'source-map';

export type ContractResult = OmitStrict<CompileContractResult, 'sourceMap'> & {
  readonly filePath: string;
  readonly name: string;
  readonly sourceMap: RawSourceMap;
};

export type CommonCodeContract = ContractResult & {
  readonly addresses: ReadonlyArray<string>;
};

export interface BuildFile {
  readonly path: string;
  readonly content: string;
}

export type BuildFiles = ReadonlyArray<BuildFile>;
