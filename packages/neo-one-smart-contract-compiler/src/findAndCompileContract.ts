import { compileContract, CompileContractResult } from './compileContract';
import { findContract } from './findContract';

export interface Options {
  readonly dir: string;
  readonly contractName: string;
}

export const findAndCompileContract = async ({ dir, contractName }: Options): Promise<CompileContractResult> => {
  const { filePath, name } = await findContract(dir, contractName);

  return compileContract({ filePath, name });
};
