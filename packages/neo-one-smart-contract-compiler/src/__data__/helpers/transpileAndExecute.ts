import { createCompilerHost, pathResolve } from '@neo-one/smart-contract-compiler-node';
import * as appRootDir from 'app-root-dir';
import { compileContract } from '../../compileContract';
import { EXECUTE_OPTIONS_DEFAULT, ExecuteOptions, executeScript } from './executeScript';
import { checkResult } from './extractors';

// tslint:disable-next-line export-name
export const transpileAndExecuteSnippet = async (
  snippetPath: string,
  options: ExecuteOptions = EXECUTE_OPTIONS_DEFAULT,
) => {
  const filePath = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
    snippetPath,
  );
  const {
    contract: { script: compiledCode },
    sourceMap,
    diagnostics,
  } = compileContract({ filePath, host: createCompilerHost() });

  const { receipt, sourceMaps } = await executeScript(diagnostics, compiledCode, sourceMap, options);
  await checkResult(receipt, sourceMaps);

  return { receipt, sourceMaps };
};
