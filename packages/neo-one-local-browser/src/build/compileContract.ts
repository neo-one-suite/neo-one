import { compileContract as compileContractBase, LinkedContracts } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '../createCompilerHost';
import { FileSystem } from '../filesystem';
import { ContractResult } from './types';

export const compileContract = async (
  filePath: string,
  name: string,
  linked: LinkedContracts,
  fs: FileSystem,
): Promise<ContractResult> => {
  const compileResult = await compileContractBase(filePath, name, createCompilerHost({ fs }), linked);
  const sourceMap = await compileResult.sourceMap;

  return {
    ...compileResult,
    sourceMap,
    filePath,
    name,
  };
};
