import Ast, { SourceFile } from 'ts-simple-ast';
import { InvocationResult } from '@neo-one/client-core';

import appRootDir from 'app-root-dir';
import path from 'path';

import { checkResult } from './extractors';
import { executeScript } from '../../executeScript';
import { monitor } from './monitor';
import * as utils from '../../utils';

const execute = async (ast: Ast, sourceFile: SourceFile, prelude?: Buffer) => {
  const result = await executeScript(monitor, ast, sourceFile, prelude);
  checkResult(result);
  return result;
};

export const executeString = async (
  code: string,
  prelude?: Buffer,
): Promise<InvocationResult> => {
  const { ast, sourceFile } = await utils.getAstForSnippet(code);
  return execute(ast, sourceFile, prelude);
};

export const executeSnippet = async (
  snippetPath: string,
  prelude?: Buffer,
): Promise<InvocationResult> => {
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
  return execute(ast, sourceFile, prelude);
};
