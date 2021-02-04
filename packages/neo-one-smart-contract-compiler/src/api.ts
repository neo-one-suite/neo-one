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

export const compileContract = async (
  filePath: string,
  _contractName: string,
  host: CompilerHost,
  linked: LinkedContracts = {},
  ignoreWarnings = false,
): Promise<CompileContractResult> => {
  const result = await compileContractBase({ filePath, host, linked });

  throwOnDiagnosticErrorOrWarning(result.diagnostics, ignoreWarnings);

  return result;
};
