import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { compileForDiagnostics } from './compile';
import { createContextForLanguageService } from './createContext';
import { CompilerHost } from './types';

export const getSemanticDiagnostics = ({
  filePath,
  host,
  languageService,
}: {
  readonly filePath: string;
  readonly host: CompilerHost;
  readonly languageService: ts.LanguageService;
}): readonly ts.Diagnostic[] => {
  const context = createContextForLanguageService(filePath, languageService, host);
  let sourceFile: ts.SourceFile | undefined;
  try {
    sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);
    compileForDiagnostics({
      sourceFile,
      context,
      sourceMaps: {},
    });
  } catch {
    // do nothing, should never happen
  }

  if (sourceFile !== undefined) {
    return context.diagnostics.filter((diagnostic) => diagnostic.file === undefined || sourceFile === diagnostic.file);
  }

  return context.diagnostics;
};
