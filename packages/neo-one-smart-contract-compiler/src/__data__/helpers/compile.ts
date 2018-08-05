import ts from 'typescript';
import * as appRootDir from 'app-root-dir';
import { compile as compileScript } from '../../compile';
import { getDiagnosticMessage, pathResolve } from '../../utils';
import { tsUtils } from '@neo-one/ts-utils';
import { createContextForSnippet, createContextForPath } from '../../createContext';
import { Context } from '../../Context';
import { DiagnosticCode } from '../../DiagnosticCode';

type ExpectOptions = { type: 'error'; code?: DiagnosticCode } | { type: 'warning'; code?: DiagnosticCode };

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
  const { context, sourceFile } = await createContextForSnippet(code);

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
  const context = await createContextForPath(snippetPath);
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, pathResolve(dir, snippetPath));

  await compile(context, sourceFile, options);
};
