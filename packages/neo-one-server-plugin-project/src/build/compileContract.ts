import {
  compileContract as compileContractBase,
  CompileContractResult,
  LinkedContracts,
} from '@neo-one/smart-contract-compiler';
import { RawSourceMap } from 'source-map';

export type ContractResult = Omit<CompileContractResult, 'sourceMap'> & {
  readonly filePath: string;
  readonly name: string;
  readonly sourceMap: RawSourceMap;
};

export const compileContract = async (
  filePath: string,
  name: string,
  linked: LinkedContracts,
): Promise<ContractResult> => {
  const compileResult = compileContractBase(filePath, name, linked);
  const sourceMap = await compileResult.sourceMap;

  return {
    ...compileResult,
    sourceMap,
    filePath,
    name,
  };
};
