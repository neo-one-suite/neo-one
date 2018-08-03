import { CallReceiptJSON } from '@neo-one/client-core';
import ts from 'typescript';
import * as appRootDir from 'app-root-dir';
import { tsUtils } from '@neo-one/ts-utils';
import { executeScript, EXECUTE_OPTIONS_DEFAULT, ExecuteOptions } from '../../executeScript';
import { getMonitor } from '../../test/getMonitor';
import { checkResult } from './extractors';
import { createContextForSnippet, createContextForPath } from '../../createContext';
import { Context } from '../../Context';
import { pathResolve } from '../../utils';
import { RawSourceMap } from 'source-map';

const execute = async (
  context: Context,
  sourceFile: ts.SourceFile,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
) => {
  const monitor = getMonitor();
  const { receipt, sourceMap } = await executeScript(monitor, context, sourceFile, options);
  await checkResult(receipt, sourceMap);

  return { receipt, sourceMap };
};

export const executeString = async (
  code: string,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
): Promise<{ receipt: CallReceiptJSON; sourceMap: RawSourceMap }> => {
  const { context, sourceFile } = await createContextForSnippet(code, { withTestHarness: true });
  return execute(context, sourceFile, options);
};

export const executeSnippet = async (
  snippetPath: string,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
): Promise<{ receipt: CallReceiptJSON; sourceMap: RawSourceMap }> => {
  const filePath = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
    snippetPath,
  );
  const context = await createContextForPath(filePath, { withTestHarness: true });
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);

  return execute(context, sourceFile, options);
};
