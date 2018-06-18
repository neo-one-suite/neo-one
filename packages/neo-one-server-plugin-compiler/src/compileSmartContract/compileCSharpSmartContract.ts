import { Binary } from '@neo-one/server-plugin';
import execa from 'execa';
import { CompileResult } from './index';

export const compileCSharpSmartContract = async ({
  scPath,
  avmPath,
  binary,
}: {
  readonly scPath: string;
  readonly avmPath: string;
  readonly binary: Binary;
}): Promise<CompileResult> =>
  execa(binary.cmd, binary.firstArgs.concat(['compile', 'csharp', scPath, avmPath]))
    .then(() => ({}))
    .catch((error) => {
      throw new Error(`C# compilation failed: ${error.stdout}`);
    });
