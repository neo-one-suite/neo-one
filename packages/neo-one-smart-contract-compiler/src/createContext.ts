import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import glob from 'glob';
import * as path from 'path';
import ts from 'typescript';
import { Context } from './Context';
import { normalizePath, pathResolve } from './utils';

function createContext(
  program: ts.Program,
  typeChecker: ts.TypeChecker,
  languageService: ts.LanguageService,
  smartContractDir: string,
): Context {
  return new Context(program, typeChecker, languageService, smartContractDir);
}

export function updateContext(context: Context, files: { readonly [fileName: string]: string | undefined }): Context {
  const { program, typeChecker, languageService, smartContractDir } = createProgram(
    context.program.getCompilerOptions(),
    Object.keys(files),
    {
      modifyHost: createModifyHostFiles(files),
      // tslint:disable-next-line no-any
      withTestHarness: (context.program as any).__withTestHarness,
    },
  );

  return context.update(program, typeChecker, languageService, smartContractDir);
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

export interface CreateContextOptions {
  readonly withTestHarness?: boolean;
}

const CREATE_CONTEXT_OPTIONS_DEFAULT = {
  withTestHarness: false,
};

const defaultModifyHost = () => {
  // do nothing
};

interface MakeContextOptions extends CreateContextOptions {
  readonly modifyHost?: (host: ts.LanguageServiceHost) => void;
}

const DEFAULT_MAKE_CONTEXT_OPTIONS = {
  ...CREATE_CONTEXT_OPTIONS_DEFAULT,
  modifyHost: defaultModifyHost,
};

const makeContext = (
  rootNames: ReadonlyArray<string>,
  options: MakeContextOptions = DEFAULT_MAKE_CONTEXT_OPTIONS,
): Context => {
  const tsConfigFilePath = pathResolve(require.resolve('@neo-one/smart-contract'), '..', '..', 'tsconfig.json');

  const res = ts.readConfigFile(tsConfigFilePath, (value) => fs.readFileSync(value, 'utf8'));
  const parseConfigHost = {
    fileExists: fs.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(res.config, parseConfigHost, path.dirname(tsConfigFilePath));

  const { program, typeChecker, languageService, smartContractDir } = createProgram(parsed.options, rootNames, options);

  return createContext(program, typeChecker, languageService, smartContractDir);
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
  { modifyHost = defaultModifyHost, withTestHarness = false }: MakeContextOptions = DEFAULT_MAKE_CONTEXT_OPTIONS,
) => {
  const smartContractDir = path.dirname(require.resolve('@neo-one/smart-contract'));
  const smartContractModule = pathResolve(smartContractDir, 'index.d.ts');
  const smartContractInternalModule = pathResolve(smartContractDir, 'internal.d.ts');
  const smartContractFiles = [
    pathResolve(smartContractDir, 'global.d.ts'),
    smartContractInternalModule,
    smartContractModule,
    withTestHarness ? pathResolve(smartContractDir, 'harness.d.ts') : undefined,
  ].filter(utils.notNull);

  const rootNames = [...new Set(rootNamesIn.concat(smartContractFiles))].map(normalizePath);

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
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getNewLine: () => ts.sys.newLine,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    resolveModuleNames,
  };

  const smartContractLibModule = pathResolve(path.dirname(require.resolve('@neo-one/smart-contract-lib')), 'index.ts');
  function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
    const mutableResolvedModules: ts.ResolvedModule[] = [];
    // tslint:disable-next-line no-loop-statement
    for (const moduleName of moduleNames) {
      // tslint:disable-next-line prefer-switch
      if (moduleName === '@neo-one/smart-contract-internal') {
        mutableResolvedModules.push({ resolvedFileName: smartContractInternalModule });
      } else if (moduleName === '@neo-one/smart-contract') {
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

  const languageService = ts.createLanguageService(servicesHost);
  const program = languageService.getProgram();
  if (program === undefined) {
    throw new Error('Something went wrong');
  }

  // tslint:disable-next-line no-any no-object-mutation
  (program as any).__withTestHarness = withTestHarness;

  return {
    program,
    typeChecker: program.getTypeChecker(),
    languageService,
    smartContractDir,
  };
};

export const createContextForDir = async (
  dir: string,
  options: CreateContextOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): Promise<Context> => {
  const files = await doGlob(path.join(dir, '**', '*.ts'));

  return makeContext(files, options);
};

export const createContextForPath = (
  filePath: string,
  options: CreateContextOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): Context => makeContext([filePath], options);

export interface SnippetResult {
  readonly context: Context;
  readonly sourceFile: ts.SourceFile;
}

export const createContextForSnippet = (
  code: string,
  options: CreateContextOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): SnippetResult => {
  const dir = appRootDir.get();
  const fileName = pathResolve(dir, 'snippetCode.ts');

  const context = makeContext([fileName], {
    ...options,
    modifyHost: createModifyHostFiles({ [fileName]: code }),
  });
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, fileName);

  return {
    context,
    sourceFile,
  };
};

export const createContextForLanguageService = (
  languageService: ts.LanguageService,
  smartContractDir: string,
): Context => {
  const program = languageService.getProgram();
  if (program === undefined) {
    throw new Error('Something went wrong');
  }

  return createContext(program, program.getTypeChecker(), languageService, smartContractDir);
};
