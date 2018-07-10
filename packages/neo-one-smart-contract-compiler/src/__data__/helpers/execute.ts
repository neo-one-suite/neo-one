import { InvocationResult } from '@neo-one/client-core';
import Ast, { SourceFile } from 'ts-simple-ast';

import * as appRootDir from 'app-root-dir';
import * as path from 'path';

import { executeScript, EXECUTE_OPTIONS_DEFAULT, ExecuteOptions } from '../../executeScript';
import { getMonitor } from '../../test/getMonitor';
import * as utils from '../../utils';
import { checkResult } from './extractors';

const execute = async (ast: Ast, sourceFile: SourceFile, options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT) => {
  const monitor = getMonitor();
  const { result, sourceMap } = await executeScript(monitor, ast, sourceFile, options);
  await checkResult(result, sourceMap);
  return result;
};

export const executeString = async (
  code: string,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
): Promise<InvocationResult> => {
  const { ast, sourceFile } = await utils.getAstForSnippet(code);
  return execute(ast, sourceFile, options);
};

export const executeSnippet = async (
  snippetPath: string,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
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
  return execute(ast, sourceFile, options);
};
