import { CompileContractResult } from './compileContract';
import { findAndCompileContract } from './findAndCompileContract';
import { setupContractTest as setupContractTestBase, SetupTestResult } from './test';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export const compileContract = async (
  dir: string,
  contractName: string,
  ignoreWarnings = false,
): Promise<CompileContractResult> => {
  const result = await findAndCompileContract({ dir, contractName });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings);

  return result;
};

export const setupContractTest = async (
  dir: string,
  contractName: string,
  ignoreWarnings = false,
): Promise<SetupTestResult> => setupContractTestBase({ dir, contractName, ignoreWarnings });

// tslint:disable-next-line export-name
export { CompileContractResult, SetupTestResult };
