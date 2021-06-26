import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from './Context';
import { CompilerHost } from './types';
import { getAllSourceFiles } from './utils';

function createContext(
  sourceFiles: Set<ts.SourceFile>,
  program: ts.Program,
  typeChecker: ts.TypeChecker,
  languageService: ts.LanguageService,
  host: CompilerHost,
): Context {
  return new Context(sourceFiles, program, typeChecker, languageService, host);
}

export function updateContext(context: Context, files: { readonly [fileName: string]: string | undefined }): Context {
  const { program, typeChecker, languageService } = createProgram(Object.keys(files), context.host, {
    modifyHost: createModifyHostFiles(files),
    // tslint:disable-next-line no-any
    withTestHarness: (context.program as any).__withTestHarness,
  });

  const sourceFiles = getAllSourceFiles(
    Object.keys(files).map((rootName) => tsUtils.file.getSourceFileOrThrow(program, rootName)),
    typeChecker,
  );

  return context.update(sourceFiles, program, typeChecker, languageService);
}

export interface CreateContextOptions {
  readonly withTestHarness?: boolean;
}

export interface CreateContextSnippetOptions extends CreateContextOptions {
  readonly fileName?: string;
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

export const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,

  noLib: true,
  typeRoots: [],

  pretty: true,

  noEmit: true,
  declaration: false,

  allowSyntheticDefaultImports: true,
  resolveJsonModule: false,
  experimentalDecorators: true,
  jsx: ts.JsxEmit.React,

  alwaysStrict: true,
  strict: true,
  skipLibCheck: true,
  noUnusedLocals: true,
  noImplicitReturns: true,
  allowUnusedLabels: false,
  noUnusedParameters: false,
  allowUnreachableCode: false,
  noFallthroughCasesInSwitch: true,
  forceConsistentCasingInFileNames: true,
};

const makeContext = (
  rootNames: ReadonlyArray<string>,
  host: CompilerHost,
  options: MakeContextOptions = DEFAULT_MAKE_CONTEXT_OPTIONS,
): Context => {
  const { program, typeChecker, languageService } = createProgram(rootNames, host, options);

  const sourceFiles = getAllSourceFiles(
    rootNames.map((rootName) => tsUtils.file.getSourceFileOrThrow(program, rootName)),
    typeChecker,
  );

  return createContext(sourceFiles, program, typeChecker, languageService, host);
};

const createModifyHostFiles =
  (files: { readonly [fileName: string]: string | undefined }) => (host: ts.LanguageServiceHost) => {
    const originalFileExists = host.fileExists === undefined ? undefined : host.fileExists.bind(host);
    // tslint:disable-next-line no-object-mutation no-any
    host.fileExists = (file) => {
      if (files[file] !== undefined) {
        return true;
      }

      return originalFileExists === undefined ? false : originalFileExists(file);
    };

    const originalReadFile = host.readFile === undefined ? undefined : host.readFile.bind(host);
    // tslint:disable-next-line no-object-mutation no-any
    host.readFile = (file, ...args: any[]) => {
      const foundFile = files[file];
      if (foundFile !== undefined) {
        return foundFile;
      }

      return originalReadFile === undefined ? undefined : originalReadFile(file, ...args);
    };
  };

const createProgram = (
  rootNames: ReadonlyArray<string>,
  host: CompilerHost,
  { modifyHost = defaultModifyHost, withTestHarness = false }: MakeContextOptions = DEFAULT_MAKE_CONTEXT_OPTIONS,
) => {
  const servicesHost = host.createLanguageServiceHost(rootNames, COMPILER_OPTIONS, withTestHarness);
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
  };
};

export const createContextForDir = async (
  dir: string,
  host: CompilerHost,
  options: CreateContextOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): Promise<Context> => {
  const files = await host.getAllTypescriptFilesInDir(dir);

  return makeContext(files, host, options);
};

export const createContextForPath = (
  filePath: string,
  host: CompilerHost,
  options: CreateContextOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): Context => makeContext([filePath], host, options);

export interface SnippetResult {
  readonly context: Context;
  readonly sourceFile: ts.SourceFile;
}

export const createContextForSnippet = (
  code: string,
  host: CompilerHost,
  { fileName: fileNameIn, ...rest }: CreateContextSnippetOptions = CREATE_CONTEXT_OPTIONS_DEFAULT,
): SnippetResult => {
  const fileName = host.createSnippetFile(fileNameIn);

  const context = makeContext([fileName], host, {
    ...rest,
    modifyHost: createModifyHostFiles({ [fileName]: code }),
  });
  const sourceFile = tsUtils.file.getSourceFileOrThrow(context.program, fileName);

  return {
    context,
    sourceFile,
  };
};

export const createContextForLanguageService = (
  filePath: string,
  languageService: ts.LanguageService,
  host: CompilerHost,
): Context => {
  const program = languageService.getProgram();
  if (program === undefined) {
    throw new Error('Something went wrong');
  }

  const sourceFile = tsUtils.file.getSourceFileOrThrow(program, filePath);
  const typeChecker = program.getTypeChecker();
  const sourceFiles = getAllSourceFiles([sourceFile], typeChecker);

  return createContext(sourceFiles, program, typeChecker, languageService, host);
};
