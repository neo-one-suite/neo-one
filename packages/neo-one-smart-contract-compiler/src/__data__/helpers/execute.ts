import { createCompilerHost, pathResolve } from '@neo-one/smart-contract-compiler-node';
import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import ts from 'typescript';
import { compile } from '../../compile';
import { Context } from '../../Context';
import { createContextForPath, createContextForSnippet } from '../../createContext';
import { EXECUTE_OPTIONS_DEFAULT, ExecuteOptions, executeScript } from './executeScript';
import { checkResult } from './extractors';

const execute = async (
  context: Context,
  sourceFile: ts.SourceFile,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
) => {
  const {
    contract: { script: compiledCode },
    sourceMap,
  } = await compile({ context, sourceFile });
  const { receipt, sourceMaps } = await executeScript(context.diagnostics, compiledCode, sourceMap, options);
  await checkResult(receipt, sourceMaps, true);

  return { receipt, sourceMaps };
};

export const executeString = async (code: string, options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT) => {
  const { context, sourceFile } = createContextForSnippet(code, createCompilerHost(), { withTestHarness: true });

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
  const context = createContextForPath(filePath, createCompilerHost(), { withTestHarness: true });
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, filePath);

  return execute(context, sourceFile, options);
};
