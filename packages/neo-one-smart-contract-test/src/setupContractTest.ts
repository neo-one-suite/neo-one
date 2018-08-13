import { SmartContract, SmartContractAny } from '@neo-one/client';
import { compileContract } from '@neo-one/smart-contract-compiler';
import { Result, setupTest } from './setupTest';

export interface SetupContractTestOptions {
  readonly filePath: string;
  readonly contractName: string;
  readonly ignoreWarnings?: boolean;
  readonly deploy?: boolean;
}

// tslint:disable-next-line no-any
export const setupContractTest = async <TContract extends SmartContract<any> = SmartContractAny>({
  filePath,
  contractName,
  ignoreWarnings,
  ...rest
}: SetupContractTestOptions): Promise<Result<TContract>> =>
  setupTest<TContract>(async () => {
    const result = compileContract(filePath, contractName, ignoreWarnings);

    return { ...result, ...rest };
  });
