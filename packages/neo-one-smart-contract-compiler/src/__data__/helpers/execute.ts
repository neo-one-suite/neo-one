import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import ts from 'typescript';
import { Context } from '../../Context';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { pathResolve } from '../../utils';
import { EXECUTE_OPTIONS_DEFAULT, ExecuteOptions, executeScript } from './executeScript';
import { checkResult } from './extractors';
import { getMonitor } from './getMonitor';

const execute = async (
  context: Context,
  sourceFile: ts.SourceFile,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
) => {
  const monitor = getMonitor();
  const { receipt, sourceMaps } = await executeScript(monitor, context, sourceFile, options);
  await checkResult(receipt, sourceMaps);

  return { receipt, sourceMaps };
};

export const executeString = async (code: string, options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT) => {
  const { context, sourceFile } = createContextForSnippet(code, { withTestHarness: true });

  return execute(context, sourceFile, options);
};

export const executeSnippet = async (snippetPath: string, options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT) => {
  const filePath = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
    snippetPath,
  );
  const context = createContextForPath(filePath, { withTestHarness: true });
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);

  return execute(context, sourceFile, options);
};
