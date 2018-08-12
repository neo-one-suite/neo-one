import { SmartContract, SmartContractAny } from '@neo-one/client';
import { compileContract as compileContractBase, CompileContractResult } from './compileContract';
import { setupContractTest as setupContractTestBase, SetupTestResult } from './test';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export const compileContract = async (
  filePath: string,
  contractName: string,
  ignoreWarnings = false,
): Promise<CompileContractResult> => {
  const result = await compileContractBase({ filePath, name: contractName });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings);

  return result;
};

// tslint:disable-next-line no-any
export const setupContractTest = async <TSmartContract extends SmartContract<any> = SmartContractAny>(
  filePath: string,
  contractName: string,
  ignoreWarnings = false,
): Promise<SetupTestResult<TSmartContract>> =>
  setupContractTestBase<TSmartContract>({ filePath, contractName, ignoreWarnings });

export { CompileContractResult, SetupTestResult };
export { scan, Contracts } from './scan';
