import { tsUtils } from '@neo-one/ts-utils';
import * as fs from 'fs-extra';
import path from 'path';
import ts from 'typescript';
import { Concatenator } from './Concatenator';

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
    throw new Error('hmmm');
  }
  const typeChecker = program.getTypeChecker();

  const getSymbol = (node: ts.Node) => {
    const symbol = tsUtils.node.getSymbol(typeChecker, node);
    if (symbol === undefined) {
      return undefined;
    }

    const aliased = tsUtils.symbol.getAliasedSymbol(typeChecker, symbol);
    if (aliased !== undefined) {
      return aliased;
    }

    return symbol;
  };

  const isIgnoreFile = () => false;
  const isGlobalIdentifier = () => false;
  const isGlobalFile = () => false;
  const isGlobalSymbol = () => false;

  const sourceFile = tsUtils.file.getSourceFileOrThrow(program, entry);

  const concatenator = new Concatenator({
    context: {
      typeChecker,
      program,
      languageService,
      getSymbol,
      isIgnoreFile,
      isGlobalIdentifier,
      isGlobalFile,
      isGlobalSymbol,
    },
    sourceFile,
  });

  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return undefined;
  }

  return tsUtils.printBundle(program, sourceFiles, concatenator.substituteNode);
}
