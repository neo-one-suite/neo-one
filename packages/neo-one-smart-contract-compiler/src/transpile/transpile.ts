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
  const concatenator = new Concatenator({
    context: {
      typeChecker: context.typeChecker,
      program: context.program,
      languageService: context.languageService,
      getSymbol: context.analysis.getSymbol.bind(context.analysis),
      isIgnoreFile: context.analysis.isSmartContract.bind(context.analysis),
      isGlobalIdentifier: context.builtins.isBuiltinIdentifier.bind(context.builtins),
      isGlobalFile: context.builtins.isBuiltinFile.bind(context.builtins),
      isGlobalSymbol: context.builtins.isBuiltinSymbol.bind(context.builtins),
    },
    sourceFile,
  });
  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return undefined;
  }

  return tsUtils.printBundle(context.program, sourceFiles, concatenator.substituteNode);
};
