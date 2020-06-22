import { normalizePath, utils } from '@neo-one/utils';
import ts from 'typescript';
import { useCaseSensitiveFileNames } from './constants';
import { FileSystem } from './filesystem';
import { createFSHost } from './sys';
import { getSmartContractLibPath, getSmartContractPath } from './utils';

export interface Options {
  readonly fs: FileSystem;
}

export const createCompilerHost = ({ fs }: Options) => {
  const fsHost = createFSHost(fs);

  return {
    getAllTypescriptFilesInDir: async (dir: string) => fsHost.readDirectory(dir, ['ts']),
    createSnippetFile: (fileName = 'snippetCode.ts') => `/tmp/${fileName}`,
    getSmartContractPath,
    getSmartContractLibPath,
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
            const result = ts.resolveModuleName(moduleName, containingFile, options, fsHost);
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
        getCompilationSettings: () => options,
        getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
        useCaseSensitiveFileNames: () => useCaseSensitiveFileNames,
        getNewLine: () => '\n',
        resolveModuleNames,
        ...fsHost,
      };

      return servicesHost;
    },
  };
};
