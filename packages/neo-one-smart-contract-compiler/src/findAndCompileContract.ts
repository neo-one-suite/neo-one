import { ABI } from '@neo-one/client';
import { ts } from 'ts-simple-ast';

import { compileContract } from './compileContract';
import { findContract } from './findContract';

export interface Options {
  dir: string;
  contractName: string;
}

export interface Result {
  script: Buffer;
  abi: ABI;
  diagnostics: ts.Diagnostic[];
}

export const findAndCompileContract = async ({
  dir,
  contractName,
}: Options) => {
  const { filePath, name } = await findContract(dir, contractName);
  const { code: script, diagnostics, abi } = await compileContract({
    filePath,
    name,
  });
  return { script, diagnostics, abi };
};
