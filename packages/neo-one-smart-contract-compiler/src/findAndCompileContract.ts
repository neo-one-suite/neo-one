import { ABI } from '@neo-one/client';
import { ts } from 'ts-simple-ast';

import { compileContract } from './compileContract';
import { findContract } from './findContract';

export interface Options {
  readonly dir: string;
  readonly contractName: string;
}

export interface Result {
  readonly script: Buffer;
  readonly abi: ABI;
  readonly diagnostics: ReadonlyArray<ts.Diagnostic>;
}

export const findAndCompileContract = async ({ dir, contractName }: Options) => {
  const { filePath, name } = await findContract(dir, contractName);
  const { code: script, diagnostics, abi } = await compileContract({
    filePath,
    name,
  });

  return { script, diagnostics, abi };
};
