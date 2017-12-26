/* @flow */
import type { ABI } from '@neo-one/client';
import type { Binary } from '@neo-one/server-plugin';

import path from 'path';

import { UnknownSmartContractFormatError } from '../errors';

import compileCSharpSmartContract from './compileCSharpSmartContract';
import compilePythonSmartContract from './compilePythonSmartContract';

export type CompileResult = {|
  abi?: ?ABI,
  hasStorage?: ?boolean,
  hasDynamicInvoke?: ?boolean,
|};

export default async ({
  scPath,
  avmPath,
  binary,
}: {|
  scPath: string,
  avmPath: string,
  binary: Binary,
|}): Promise<CompileResult> => {
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
