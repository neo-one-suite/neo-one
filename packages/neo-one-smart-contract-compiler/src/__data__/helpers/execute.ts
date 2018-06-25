import { InvocationResult } from '@neo-one/client-core';
import Ast, { SourceFile } from 'ts-simple-ast';

import appRootDir from 'app-root-dir';
import path from 'path';

import { executeScript } from '../../executeScript';
import * as utils from '../../utils';
import { checkResult } from './extractors';
import { getMonitor } from './getMonitor';

const execute = async (ast: Ast, sourceFile: SourceFile, prelude?: Buffer) => {
  const monitor = getMonitor();
  const result = await executeScript(monitor, ast, sourceFile, prelude);
  checkResult(result);
  return result;
};

export const executeString = async (code: string, prelude?: Buffer): Promise<InvocationResult> => {
  const { ast, sourceFile } = await utils.getAstForSnippet(code);
  return execute(ast, sourceFile, prelude);
};

export const executeSnippet = async (snippetPath: string, prelude?: Buffer): Promise<InvocationResult> => {
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
