import {
  compileContract,
  findContract,
} from '@neo-one/smart-contract-compiler';

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
    const { filePath, name } = await findContract(dir, contractName);
    const { code: script, diagnostics, abi } = await compileContract({
      dir,
      filePath,
      name,
    });
    return { script, diagnostics, abi, ignoreWarnings };
  });
