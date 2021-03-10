import ts from 'typescript';
import { LinkedContracts } from './compile/types';
import { compileContract as compileContractBase, CompileContractResult } from './compileContract';
import { getSemanticDiagnostics as getSemanticDiagnosticsBase } from './getSemanticDiagnostics';
import { CompilerHost } from './types';
import { throwOnDiagnosticErrorOrWarning } from './utils';

export const getSemanticDiagnostics = (
  filePath: string,
  languageService: ts.LanguageService,
  host: CompilerHost,
): ReadonlyArray<ts.Diagnostic> => getSemanticDiagnosticsBase({ filePath, languageService, host });

export const compileContract = (
  filePath: string,
  contractName: string,
  host: CompilerHost,
  linked: LinkedContracts = {},
  ignoreWarnings = false,
): CompileContractResult => {
  const result = compileContractBase({ filePath, host, linked });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings, `Error while compiling ${contractName}`);

  return result;
};
