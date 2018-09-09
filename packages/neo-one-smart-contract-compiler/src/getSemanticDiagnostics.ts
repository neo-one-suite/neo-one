import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { compileForDiagnostics } from './compile';
import { createContextForLanguageService } from './createContext';

export const getSemanticDiagnostics = ({
  filePath,
  smartContractDir,
  languageService,
}: {
  readonly filePath: string;
  readonly smartContractDir: string;
  readonly languageService: ts.LanguageService;
}): ReadonlyArray<ts.Diagnostic> => {
  const context = createContextForLanguageService(filePath, languageService, smartContractDir);
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
