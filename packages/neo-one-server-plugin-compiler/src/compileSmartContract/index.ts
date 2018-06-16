import { ABI } from '@neo-one/client';
import { Binary } from '@neo-one/server-plugin';
import path from 'path';
import { UnknownSmartContractFormatError } from '../errors';
import { compileCSharpSmartContract } from './compileCSharpSmartContract';
import { compilePythonSmartContract } from './compilePythonSmartContract';

export interface CompileResult {
  readonly abi?: ABI | null;
  readonly hasStorage?: boolean | null;
  readonly hasDynamicInvoke?: boolean | null;
  readonly payable?: boolean | null;
}

export const compileSmartContract = async ({
  scPath,
  avmPath,
  binary,
}: {
  readonly scPath: string;
  readonly avmPath: string;
  readonly binary: Binary;
}): Promise<CompileResult> => {
  const ext = path.extname(scPath);
  switch (ext) {
    case '.py':
      return compilePythonSmartContract({ scPath, avmPath, binary });
    case '.dll':
      return compileCSharpSmartContract({ scPath, avmPath, binary });
    default:
      throw new UnknownSmartContractFormatError({
        ext,
        extensions: [['py', 'Python'], ['dll', 'C#']],
      });
  }
};
