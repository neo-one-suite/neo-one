import { tsUtils } from '@neo-one/ts-utils';
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import * as path from 'path';
import ts from 'typescript';
import { Context } from './Context';
import { getGlobals, getLibAliases, getLibs } from './symbols';

function createContext(program: ts.Program, typeChecker: ts.TypeChecker, languageService: ts.LanguageService): Context {
  return new Context(
    program,
    typeChecker,
    languageService,
    getGlobals(program, typeChecker),
    getLibs(program, typeChecker),
    getLibAliases(program, languageService),
  );
}

export function updateContext(context: Context, files: { readonly [fileName: string]: string | undefined }): Context {
  const { program, typeChecker, languageService } = createProgram(
    context.program.getCompilerOptions(),
    Object.keys(files),
    createModifyHostFiles(files),
  );

  return context.update(
    program,
    typeChecker,
    languageService,
    getGlobals(program, typeChecker),
    getLibs(program, typeChecker),
    getLibAliases(program, languageService),
  );
}

const doGlob = async (value: string) =>
  new Promise<ReadonlyArray<string>>((resolve, reject) =>
    glob(value, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    }),
  );

const makeContext = async (
  rootNames: ReadonlyArray<string>,
  modifyHost: (host: ts.LanguageServiceHost) => void = () => {
    // do nothing
  },
): Promise<Context> => {
  const tsConfigFilePath = path.resolve(
    require.resolve('@neo-one/smart-contract-compiler'),
    '..',
    '..',
    'tsconfig.default.json',
  );

  const res = ts.readConfigFile(tsConfigFilePath, (value) => fs.readFileSync(value, 'utf8'));
  const parseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(res.config, parseConfigHost, path.dirname(tsConfigFilePath));

  const { program, typeChecker, languageService } = createProgram(parsed.options, rootNames, modifyHost);

  return createContext(program, typeChecker, languageService);
};

const createModifyHostFiles = (files: { readonly [fileName: string]: string | undefined }) => (
  host: ts.LanguageServiceHost,
) => {
  const originalFileExists = host.fileExists === undefined ? ts.sys.fileExists : host.fileExists.bind(host);
  // tslint:disable-next-line no-object-mutation no-any
  host.fileExists = (file) => {
    if (files[file] !== undefined) {
      return true;
    }

    return originalFileExists(file);
  };

  const originalReadFile = host.readFile === undefined ? ts.sys.readFile : host.readFile.bind(host);
  // tslint:disable-next-line no-object-mutation no-any
  host.readFile = (file, ...args: any[]) => {
    const foundFile = files[file];
    if (foundFile !== undefined) {
      return foundFile;
    }

    return originalReadFile(file, ...args);
  };
};

const createProgram = (
  options: ts.CompilerOptions,
  rootNamesIn: ReadonlyArray<string>,
  modifyHost: (host: ts.LanguageServiceHost) => void = () => {
    // do nothing
  },
) => {
  const smartContractDir = path.dirname(require.resolve('@neo-one/smart-contract'));
  const smartContractModule = path.resolve(smartContractDir, 'index.ts');
  const smartContractFiles = [
    path.resolve(smartContractDir, 'index.d.ts'),
    smartContractModule,
    path.resolve(smartContractDir, 'lib.ts'),
  ];

  const rootNames = [
    ...new Set(rootNamesIn.concat(smartContractFiles).concat(require.resolve('@types/node/index.d.ts'))),
  ];

  const mutableFiles: ts.MapLike<{ version: number } | undefined> = {};
  // initialize the list of files
  rootNames.forEach((fileName) => {
    mutableFiles[fileName] = { version: 0 };
  });
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...rootNames],
    getScriptVersion: (fileName) => {
      const file = mutableFiles[fileName];

      return file === undefined ? '' : file.version.toString();
    },
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
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    resolveModuleNames,
  };

  const smartContractLibModule = path.resolve(path.dirname(require.resolve('@neo-one/smart-contract-lib')), 'index.ts');
  function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
    const mutableResolvedModules: ts.ResolvedModule[] = [];
    // tslint:disable-next-line no-loop-statement
    for (const moduleName of moduleNames) {
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

  modifyHost(servicesHost);

  const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
  const program = languageService.getProgram();
  if (program === undefined) {
    throw new Error('Something went wrong');
  }

  return {
    program,
    typeChecker: program.getTypeChecker(),
    languageService,
  };
};

export const createContextForDir = async (dir: string): Promise<Context> => {
  const files = await doGlob(path.join(dir, '**', '*.ts'));

  return makeContext(files);
};

export const createContextForPath = async (filePath: string): Promise<Context> => makeContext([filePath]);

export interface SnippetResult {
  readonly context: Context;
  readonly sourceFile: ts.SourceFile;
}

export const createContextForSnippet = async (code: string): Promise<SnippetResult> => {
  const dir = appRootDir.get();
  const fileName = path.resolve(dir, 'snippetCode.ts');

  const context = await makeContext([fileName], createModifyHostFiles({ [fileName]: code }));
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, fileName);

  return {
    context,
    sourceFile,
  };
};
