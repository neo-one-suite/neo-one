import { codeFrameColumns } from '@babel/code-frame';
import * as path from 'path';
import ts from 'typescript';

interface Options {
  readonly onlyFileName?: boolean;
  readonly noHighlight?: boolean;
}

const MESSAGE_INDENT = '    ';

const getRenderedCallsite = (fileContent: string, line: number, column?: number, noHighlight = false) => {
  let renderedCallsite = codeFrameColumns(fileContent, { start: { column, line } }, { highlightCode: !noHighlight });

  renderedCallsite = renderedCallsite
    .split('\n')
    .map((renderedLine: string) => MESSAGE_INDENT + renderedLine)
    .join('\n');

  renderedCallsite = `\n${renderedCallsite}\n`;

  return renderedCallsite;
};

export const getDiagnosticMessage = (
  diagnostic: ts.Diagnostic,
  { onlyFileName = false, noHighlight = false }: Options = { onlyFileName: false, noHighlight: false },
): string => {
  if (diagnostic.file && diagnostic.start) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    const fileName = diagnostic.file.fileName;
    const filePath = onlyFileName ? path.basename(fileName) : fileName;
    const callSite = getRenderedCallsite(diagnostic.file.text, line + 1, character + 1, noHighlight);

    return `${filePath} (${line + 1},${character + 1}): ${message}\n${callSite}`;
  }

  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
};

export function throwOnDiagnosticErrorOrWarning(diagnostics: ReadonlyArray<ts.Diagnostic>, ignoreWarnings?: boolean) {
  const error = diagnostics.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (error !== undefined) {
    throw new Error(`Compilation error: ${getDiagnosticMessage(error)}`);
  }

  const warning = diagnostics.find((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Warning);
  if (warning !== undefined && !ignoreWarnings) {
    throw new Error(`Compilation warning: ${getDiagnosticMessage(warning)}`);
  }
}
