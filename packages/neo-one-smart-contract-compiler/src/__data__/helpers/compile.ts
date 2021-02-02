import { createCompilerHost, pathResolve } from '@neo-one/smart-contract-compiler-node';
import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import ts from 'typescript';
import { compile as compileScript } from '../../compile';
import { Context } from '../../Context';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { DiagnosticCode } from '../../DiagnosticCode';
import { getDiagnosticMessage } from '../../utils';

type ExpectOptions =
  | { readonly type: 'error'; readonly code?: DiagnosticCode }
  | { readonly type: 'warning'; readonly code?: DiagnosticCode };

const compile = async (context: Context, sourceFile: ts.SourceFile, options: ExpectOptions) => {
  await compileScript({ context, sourceFile });

  const expectDiagnostic = (category: ts.DiagnosticCategory) => {
    const diag = context.diagnostics.find(
      (diagnostic) =>
        diagnostic.category === category && (options.code === undefined || diagnostic.code === options.code),
    );
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
  const { context, sourceFile } = createContextForSnippet(code, createCompilerHost());

  await compile(context, sourceFile, options);
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
  const context = createContextForPath(snippetPath, createCompilerHost());
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, pathResolve(dir, snippetPath));

  await compile(context, sourceFile, options);
};
