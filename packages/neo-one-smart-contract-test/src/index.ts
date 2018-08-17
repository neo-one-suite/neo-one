import { SmartContract, SmartContractAny } from '@neo-one/client';
import { setupContractTest as setupContractTestBase } from './setupContractTest';
import { Result as SetupTestResult } from './setupTest';

export interface SetupContractTestOptions {
  readonly ignoreWarnings?: boolean;
  readonly deploy?: boolean;
}

// tslint:disable-next-line no-any
export const setupContractTest = async <TSmartContract extends SmartContract<any> = SmartContractAny>(
  filePath: string,
  contractName: string,
  { ignoreWarnings = false, deploy = false }: SetupContractTestOptions = { ignoreWarnings: false, deploy: false },
): Promise<SetupTestResult<TSmartContract>> =>
  setupContractTestBase<TSmartContract>({ filePath, contractName, ignoreWarnings, deploy });

// tslint:disable-next-line export-name
export { SetupTestResult };
