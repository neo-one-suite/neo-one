import { compileContract as compileContractBase, CompileContractResult } from '@neo-one/smart-contract-compiler';
import { RawSourceMap } from 'source-map';
import { Contract } from './findContracts';

export type ContractResult = Omit<CompileContractResult, 'sourceMap'> & {
  readonly filePath: string;
  readonly contractName: string;
  readonly sourceMap: RawSourceMap;
};

export const compileContract = async ({ filePath, contractName }: Contract): Promise<ContractResult> => {
  const compileResult = compileContractBase(filePath, contractName);
  const sourceMap = await compileResult.sourceMap;

  return {
    ...compileResult,
    sourceMap,
    filePath,
    contractName,
  };
};
