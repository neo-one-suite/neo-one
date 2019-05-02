import { normalizePath, utils } from '@neo-one/utils';
import * as appRootDir from 'app-root-dir';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from './pathResolve';

export interface Options {
  readonly smartContractDir?: string;
  readonly smartContractLibDir?: string;
}

export const createCompilerHost = ({
  smartContractDir = path.dirname(require.resolve('@neo-one/smart-contract')),
  smartContractLibDir = path.dirname(require.resolve('@neo-one/smart-contract-lib')),
}: Options = {}) => ({
  getAllTypescriptFilesInDir: async (dir: string) =>
    new Promise<readonly string[]>((resolve, reject) =>
      glob(path.join(dir, '**', '*.ts'), (error, matches) => {
        if (error) {
          reject(error);
        } else {
          resolve(matches);
        }
      }),
    ),
  createSnippetFile: (fileName = 'snippetCode.ts') => pathResolve(appRootDir.get(), fileName),
  getSmartContractPath: (value: string) => pathResolve(smartContractDir, value),
  getSmartContractLibPath: (value: string) => pathResolve(smartContractLibDir, value),
  createLanguageServiceHost(
    rootNamesIn: readonly string[],
    options: ts.CompilerOptions,
    withTestHarness = false,
  ): ts.LanguageServiceHost {
    const smartContractModule = this.getSmartContractPath('index.d.ts');
    const smartContractFiles = [
      this.getSmartContractPath('global.d.ts'),
      smartContractModule,
      withTestHarness ? this.getSmartContractPath('harness.d.ts') : undefined,
    ].filter(utils.notNull);

    const rootNames = [...new Set(rootNamesIn.concat(smartContractFiles))].map(normalizePath);

    const smartContractLibModule = this.getSmartContractLibPath('index.ts');
    function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
      const mutableResolvedModules: ts.ResolvedModule[] = [];
      // tslint:disable-next-line no-loop-statement
      for (const moduleName of moduleNames) {
        // tslint:disable-next-line prefer-switch
        if (moduleName === '@neo-one/smart-contract') {
          mutableResolvedModules.push({ resolvedFileName: smartContractModule });
        } else if (moduleName === '@neo-one/smart-contract-lib') {
          mutableResolvedModules.push({ resolvedFileName: smartContractLibModule });
        } else {
          const result = ts.resolveModuleName(moduleName, containingFile, options, {
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile,
          });
          // tslint:disable-next-line no-non-null-assertion
          mutableResolvedModules.push(result.resolvedModule!);
        }
      }

      return mutableResolvedModules;
    }

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [...rootNames],
      getScriptVersion: () => '0',
      getScriptSnapshot: (fileName) => {
        // tslint:disable-next-line no-non-null-assertion
        if (!servicesHost.fileExists!(fileName)) {
          return undefined;
        }

        // tslint:disable-next-line no-non-null-assertion
        return ts.ScriptSnapshot.fromString(servicesHost.readFile!(fileName)!);
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => options,
      getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
      useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
      getNewLine: () => ts.sys.newLine,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      resolveModuleNames,
    };

    return servicesHost;
  },
});
