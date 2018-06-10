import { findAndCompileContract } from '@neo-one/smart-contract-compiler';

import { Result, setupTest } from './setupTest';

export interface SetupContractTestOptions {
  dir: string;
  contractName: string;
  ignoreWarnings?: boolean;
}

export const setupContractTest = async ({
  dir,
  contractName,
  ignoreWarnings,
}: SetupContractTestOptions): Promise<Result> =>
  setupTest(async () => {
    const { script, diagnostics, abi } = await findAndCompileContract({
      dir,
      contractName,
    });
    return { script, diagnostics, abi, ignoreWarnings };
  });
