import { tsUtils } from '@neo-one/ts-utils';
import { Concatenator } from '@neo-one/typescript-concatenator';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';

export interface TranspileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
}

export interface TranspileResult {
  readonly text: string;
  readonly sourceMap: RawSourceMap;
}

export const transpile = ({ sourceFile, context }: TranspileOptions): TranspileResult | undefined => {
  const isExternalFile = (
    node: ts.SourceFile,
    _importPath: string,
    decl: ts.ImportDeclaration | ts.ExportDeclaration,
  ) => {
    if (
      ts.isImportDeclaration(decl) &&
      !tsUtils.importExport.hasValueReference(context.program, context.languageService, decl)
    ) {
      return true;
    }

    return context.builtins.isBuiltinFile(node);
  };
  const concatenator = new Concatenator({
    context: {
      typeChecker: context.typeChecker,
      program: context.program,
      languageService: context.languageService,
      getSymbol: context.analysis.getSymbol.bind(context.analysis),
      isExternalFile,
    },
    sourceFile,
  });
  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return undefined;
  }

  return tsUtils.printBundle(context.program, sourceFiles, concatenator.substituteNode);
};
