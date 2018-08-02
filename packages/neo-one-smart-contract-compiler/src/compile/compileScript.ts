import { tsUtils } from '@neo-one/ts-utils';
import { createContextForPath } from '../createContext';
import { normalizePath } from '../utils';
import { compile } from './compile';
import { CompileResult } from './types';

export const compileScript = async (scriptPathIn: string): Promise<CompileResult> => {
  const scriptPath = normalizePath(scriptPathIn);
  const context = await createContextForPath(scriptPath);
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, scriptPath);

  return compile({ context, sourceFile });
};
