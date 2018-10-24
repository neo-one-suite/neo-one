import { tsUtils } from '@neo-one/ts-utils';
import * as fs from 'fs-extra';
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
      const text = fs.readFileSync(configPath, 'utf8');
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

  const indexExportedSymbols = tsUtils.file.getExportedSymbols(typeChecker, sourceFile).map((symbol) => {
    const aliased = tsUtils.symbol.getAliasedSymbol(typeChecker, symbol);

    return aliased === undefined ? symbol : aliased;
  });
  const globalExportSymbols = new Set(indexExportedSymbols);

  const isGlobalFile = (node: ts.SourceFile) => program.isSourceFileFromExternalLibrary(node);
  const isIgnoreFile = () => false;
  const isGlobalIdentifier = () => false;
  const isGlobalSymbol = (symbol: ts.Symbol) => globalExportSymbols.has(symbol);
  const skipReferenceCheck = true;

  const concatenator = new Concatenator({
    context: {
      typeChecker,
      program,
      languageService,
      getSymbol: tsUtils.node.getSymbolOrAlias(typeChecker),
      isIgnoreFile,
      isGlobalIdentifier,
      isGlobalFile,
      isGlobalSymbol,
      skipReferenceCheck,
    },
    sourceFile,
  });

  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return undefined;
  }

  return tsUtils.printBundle(program, sourceFiles, concatenator.substituteNode);
}
