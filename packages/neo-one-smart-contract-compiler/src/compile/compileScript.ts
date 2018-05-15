import path from 'path';

import { CompileResult } from './types';

import * as utils from '../utils';
import { compile } from './compile';

export const compileScript = async (
  scriptPath: string,
): Promise<CompileResult> => {
  const ast = await utils.getAst(path.dirname(scriptPath));
  const sourceFile = ast.getSourceFileOrThrow(scriptPath);
  return compile({ ast, sourceFile });
};
