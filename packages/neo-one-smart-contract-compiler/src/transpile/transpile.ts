import { tsUtils } from '@neo-one/ts-utils';
import { RawSourceMap } from 'source-map';
import ts from 'typescript';
import { Context } from '../Context';
import { Concatenator } from './Concatenator';

export interface TranspileOptions {
  readonly sourceFile: ts.SourceFile;
  readonly context: Context;
}

export interface TranspileResult {
  readonly text: string;
  readonly sourceMap: RawSourceMap;
}

export const transpile = ({ sourceFile, context }: TranspileOptions): TranspileResult | undefined => {
  const concatenator = new Concatenator(context, sourceFile);
  const sourceFiles = concatenator.sourceFiles;
  if (sourceFiles.length === 0 || sourceFiles.length === 1) {
    return undefined;
  }

  return tsUtils.printBundle(context.program, sourceFiles, concatenator.substituteNode);
};
