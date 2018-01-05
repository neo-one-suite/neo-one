import { ABI } from '@neo-one/client/src';
import { compileScript } from '@neo-one/smart-contract-compiler';

import { Result, setupTest } from './setupTest';

export interface SetupBasicTestOptions {
  contractPath: string;
  abi: ABI;
  ignoreWarnings?: boolean;
}

export const setupBasicTest = async ({
  contractPath,
  abi,
  ignoreWarnings,
}: SetupBasicTestOptions): Promise<Result> =>
  setupTest(async () => {
    const { code: script, context } = await compileScript(contractPath);
    return { script, diagnostics: context.diagnostics, abi, ignoreWarnings };
  });
