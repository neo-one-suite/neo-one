import { ABI, ContractParameterType } from '@neo-one/client-common';
import { RawSourceMap } from 'source-map';

export interface Contract {
  readonly parameters: readonly ContractParameterType[];
  readonly returnType: ContractParameterType;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly storage: boolean;
  readonly dynamicInvoke: boolean;
  readonly payable: boolean;
}

export interface TranspileResult {
  readonly sourceFiles: {
    readonly [filePath: string]: {
      readonly text: string;
      readonly sourceMap: RawSourceMap;
    };
  };
  readonly abi: ABI;
  readonly contract: Contract;
}
