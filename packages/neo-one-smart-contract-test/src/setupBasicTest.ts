import { ABI } from '@neo-one/client';
import { compileScript } from '@neo-one/smart-contract-compiler';

import { Result, setupTest } from './setupTest';

export interface SetupBasicTestOptions {
  readonly contractPath: string;
  readonly abi: ABI;
  readonly ignoreWarnings?: boolean;
}

export const setupBasicTest = async ({ contractPath, abi, ignoreWarnings }: SetupBasicTestOptions): Promise<Result> =>
  setupTest(async () => {
    const { code, context, sourceMap } = await compileScript(contractPath);

    return {
      sourceMap,
      contract: {
        script: code.toString('hex'),
        parameters: ['String', 'Array'],
        returnType: 'ByteArray',
        name: 'TestContract',
        codeVersion: '1.0',
        author: 'test',
        email: 'test@test.com',
        description: 'test',
        properties: {
          storage: true,
          dynamicInvoke: true,
          payable: true,
        },
      },
      diagnostics: context.diagnostics,
      abi,
      ignoreWarnings,
    };
  });
