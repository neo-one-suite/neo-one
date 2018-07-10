import * as path from 'path';
import { DiagnosticCategory, ts } from 'ts-simple-ast';

export const getDiagnosticMessage = (diagnostic: ts.Diagnostic, onlyFileName = false): string => {
  if (diagnostic.file && diagnostic.start) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    const fileName = diagnostic.file.fileName;
    const filePath = onlyFileName ? path.basename(fileName) : fileName;

    return `${filePath} (${line + 1},${character + 1}): ${message}`;
  }

  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
};

export function throwOnDiagnosticErrorOrWarning(diagnostics: ReadonlyArray<ts.Diagnostic>, ignoreWarnings?: boolean) {
  const error = diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Error);
  if (error !== undefined) {
    throw new Error(`Compilation error: ${getDiagnosticMessage(error)}`);
  }

  const warning = diagnostics.find((diagnostic) => diagnostic.category === DiagnosticCategory.Warning);
  if (warning !== undefined && !ignoreWarnings) {
    throw new Error(`Compilation warning: ${getDiagnosticMessage(warning)}`);
  }
}
