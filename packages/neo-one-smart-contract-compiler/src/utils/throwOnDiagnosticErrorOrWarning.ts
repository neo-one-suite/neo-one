import ts from 'typescript';

import { getDiagnosticMessage } from './getDiagnosticMessage';

export function throwOnDiagnosticErrorOrWarning(diagnostics: ReadonlyArray<ts.Diagnostic>, ignoreWarnings = false) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  const warnings = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Warning);
  const errorMessage =
    errors.length === 0
      ? undefined
      : errors.map((error) => `Compilation error: ${getDiagnosticMessage(error)}`).join('\n');
  const warningMessage =
    warnings.length === 0
      ? undefined
      : warnings.map((warning) => `Compilation warning: ${getDiagnosticMessage(warning)}`).join('\n');
  if (errorMessage !== undefined) {
    throw new Error(`${errorMessage}${warningMessage === undefined ? '' : warningMessage}`);
  }

  if (warningMessage !== undefined && !ignoreWarnings) {
    throw new Error(warningMessage);
  }
}
