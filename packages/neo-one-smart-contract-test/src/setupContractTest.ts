import { findAndCompileContract } from '@neo-one/smart-contract-compiler';

import { Result, setupTest } from './setupTest';

export interface SetupContractTestOptions {
  readonly dir: string;
  readonly contractName: string;
  readonly ignoreWarnings?: boolean;
}

export const setupContractTest = async ({
  dir,
  contractName,
  ignoreWarnings,
}: SetupContractTestOptions): Promise<Result> =>
  setupTest(async () => {
    const result = await findAndCompileContract({
      dir,
      contractName,
    });

    return { ...result, ignoreWarnings };
  });
