import { tsUtils } from '@neo-one/ts-utils';
import path from 'path';
import ts from 'typescript';
import { Concatenator } from './Concatenator';

export type SymbolAndSources = { readonly [Symbol in string]: string };
export type SourceFileSymbolAndSources = { readonly [SourceFile in string]: SymbolAndSources };

export function concatenate(entry: string) {
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [entry],
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
    getCompilationSettings: () => {
      const configPath = ts.findConfigFile(entry, ts.sys.fileExists);
      if (configPath === undefined) {
        return ts.getDefaultCompilerOptions();
      }
      const text = ts.sys.readFile(configPath, 'utf8');
      if (text === undefined) {
        throw new Error(`Could not read config file at ${configPath}`);
      }
      const parseResult = ts.parseConfigFileTextToJson(configPath, text);

      return ts.parseJsonConfigFileContent(
        parseResult.config,
        {
          useCaseSensitiveFileNames: true,
          readDirectory: ts.sys.readDirectory,
          fileExists: ts.sys.fileExists,
          readFile: ts.sys.readFile,
        },
        path.dirname(configPath),
        undefined,
        undefined,
      ).options;
    },
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getNewLine: () => ts.sys.newLine,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  };

  const languageService = ts.createLanguageService(servicesHost);
  const program = languageService.getProgram();
  if (program === undefined) {
    throw new Error('Failed to get program from language service.');
  }

  const sourceFile = tsUtils.file.getSourceFileOrThrow(program, entry);
  const typeChecker = program.getTypeChecker();

  const isExternalFile = (
    _node: ts.SourceFile,
    importPath: string,
    _decl: ts.ImportDeclaration | ts.ExportDeclaration,
  ) => !importPath.startsWith('.');

  const concatenator = new Concatenator({
    context: {
      typeChecker,
      program,
      languageService,
      isExternalFile,
    },
    sourceFile,
  });

  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return tsUtils.file.getText(sourceFiles[0]);
  }

  return tsUtils.printBundle(program, sourceFiles, concatenator.substituteNode).text;
}
