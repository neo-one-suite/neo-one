import ts from 'typescript';
import { compileContract as compileContractBase, CompileContractResult } from './compileContract';
import { getSemanticDiagnostics as getSemanticDiagnosticsBase } from './getSemanticDiagnostics';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export const getSemanticDiagnostics = (
  filePath: string,
  languageService: ts.LanguageService,
  smartContractDir: string,
): ReadonlyArray<ts.Diagnostic> => getSemanticDiagnosticsBase({ filePath, languageService, smartContractDir });

export const compileContract = (
  filePath: string,
  contractName: string,
  ignoreWarnings = false,
): CompileContractResult => {
  const result = compileContractBase({ filePath, name: contractName });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings);

  return result;
};

export interface SetupContractTestOptions {
  readonly ignoreWarnings?: boolean;
  readonly deploy?: boolean;
}

export { CompileContractResult };
export { scan, Contracts } from './scan';
