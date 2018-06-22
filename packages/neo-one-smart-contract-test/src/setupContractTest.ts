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
    const { contract, diagnostics, abi } = await findAndCompileContract({
      dir,
      contractName,
    });

    return { contract, diagnostics, abi, ignoreWarnings };
  });
