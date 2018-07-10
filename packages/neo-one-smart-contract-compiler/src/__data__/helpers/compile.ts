import Ast, { DiagnosticCategory, SourceFile } from 'ts-simple-ast';

import * as appRootDir from 'app-root-dir';
import * as path from 'path';

import { compile as compileScript } from '../../compile';
import * as utils from '../../utils';
import { getDiagnosticMessage } from '../../utils';

type ExpectOptions = { type: 'error' } | { type: 'warning' };

const compile = (ast: Ast, sourceFile: SourceFile, options: ExpectOptions) => {
  const { context } = compileScript({ ast, sourceFile });

  const expectDiagnostic = (category: DiagnosticCategory) => {
    const diag = context.diagnostics.find((diagnostic) => diagnostic.category === category);
    if (diag === undefined) {
      expect(diag).toBeDefined();
    } else {
      expect(getDiagnosticMessage(diag, true)).toMatchSnapshot();
    }
  };

  if (options.type === 'error') {
    expectDiagnostic(DiagnosticCategory.Error);
  }

  if (options.type === 'warning') {
    expectDiagnostic(DiagnosticCategory.Warning);
  }
};

export const compileString = async (code: string, options: ExpectOptions): Promise<void> => {
  const { ast, sourceFile } = await utils.getAstForSnippet(code);

  compile(ast, sourceFile, options);
};

export const compileSnippet = async (snippetPath: string, options: ExpectOptions): Promise<void> => {
  const dir = path.resolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
  );
  const ast = await utils.getAst(dir);
  const sourceFile = ast.getSourceFileOrThrow(path.resolve(dir, snippetPath));

  compile(ast, sourceFile, options);
};
