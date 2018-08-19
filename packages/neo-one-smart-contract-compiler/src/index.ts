import * as path from 'path';
import ts from 'typescript';
import { LinkedContracts } from './compile/types';
import { compileContract as compileContractBase, CompileContractResult } from './compileContract';
import { getSemanticDiagnostics as getSemanticDiagnosticsBase } from './getSemanticDiagnostics';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export const getSemanticDiagnostics = (
  filePath: string,
  languageService: ts.LanguageService,
  smartContractDir: string = path.dirname(require.resolve('@neo-one/smart-contract')),
): ReadonlyArray<ts.Diagnostic> => getSemanticDiagnosticsBase({ filePath, languageService, smartContractDir });

export const compileContract = (
  filePath: string,
  contractName: string,
  linked: LinkedContracts = {},
  ignoreWarnings = false,
): CompileContractResult => {
  const result = compileContractBase({ filePath, name: contractName, linked });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings);

  return result;
};

export { CompileContractResult, LinkedContracts };
export { scan, Contracts } from './scan';
