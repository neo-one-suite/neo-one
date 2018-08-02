import ts from 'typescript';
import * as appRootDir from 'app-root-dir';
import { compile as compileScript } from '../../compile';
import { getDiagnosticMessage, pathResolve } from '../../utils';
import { tsUtils } from '@neo-one/ts-utils';
import { createContextForSnippet, createContextForPath } from '../../createContext';
import { Context } from '../../Context';

type ExpectOptions = { type: 'error' } | { type: 'warning' };

const compile = (context: Context, sourceFile: ts.SourceFile, options: ExpectOptions) => {
  compileScript({ context, sourceFile });

  const expectDiagnostic = (category: ts.DiagnosticCategory) => {
    const diag = context.diagnostics.find((diagnostic) => diagnostic.category === category);
    if (diag === undefined) {
      expect(diag).toBeDefined();
    } else {
      expect(getDiagnosticMessage(diag, { onlyFileName: true, noHighlight: true })).toMatchSnapshot();
    }
  };

  if (options.type === 'error') {
    expectDiagnostic(ts.DiagnosticCategory.Error);
  }

  if (options.type === 'warning') {
    expectDiagnostic(ts.DiagnosticCategory.Warning);
  }
};

export const compileString = async (code: string, options: ExpectOptions): Promise<void> => {
  const { context, sourceFile } = await createContextForSnippet(code);

  compile(context, sourceFile, options);
};

export const compileSnippet = async (snippetPath: string, options: ExpectOptions): Promise<void> => {
  const dir = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
  );
  const context = await createContextForPath(snippetPath);
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, pathResolve(dir, snippetPath));

  compile(context, sourceFile, options);
};
