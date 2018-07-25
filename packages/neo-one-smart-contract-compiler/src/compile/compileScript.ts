import { tsUtils } from '@neo-one/ts-utils';
import { createContextForPath } from '../createContext';
import { compile } from './compile';
import { CompileResult } from './types';

export const compileScript = async (scriptPath: string): Promise<CompileResult> => {
  const context = await createContextForPath(scriptPath);
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, scriptPath);

  return compile({ context, sourceFile });
};
