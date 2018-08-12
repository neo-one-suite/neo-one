import { SmartContract, SmartContractAny } from '@neo-one/client';
import { compileContract } from '../compileContract';
import { Result, setupTest } from './setupTest';

export interface SetupContractTestOptions {
  readonly filePath: string;
  readonly contractName: string;
  readonly ignoreWarnings?: boolean;
}

// tslint:disable-next-line no-any
export const setupContractTest = async <TContract extends SmartContract<any> = SmartContractAny>({
  filePath,
  contractName,
  ignoreWarnings,
}: SetupContractTestOptions): Promise<Result<TContract>> =>
  setupTest<TContract>(async () => {
    const result = await compileContract({ filePath, name: contractName });

    return { ...result, ignoreWarnings };
  });
