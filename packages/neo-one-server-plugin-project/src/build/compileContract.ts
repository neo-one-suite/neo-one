import { compileContract as compileContractBase, CompileContractResult } from '@neo-one/smart-contract-compiler';
import { Contract } from './findContracts';

export interface ContractResult extends CompileContractResult {
  readonly filePath: string;
  readonly contractName: string;
}

export const compileContract = async ({ filePath, contractName }: Contract): Promise<ContractResult> => {
  const compileResult = await compileContractBase(filePath, contractName);

  return {
    ...compileResult,
    filePath,
    contractName,
  };
};
