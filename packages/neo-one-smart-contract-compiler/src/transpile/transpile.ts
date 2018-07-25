import ts from 'typescript';
import { Context } from '../Context';
import { NEOTranspiler } from './transpiler';
import { TranspileResult } from './types';

export interface TranspileOptions {
  readonly smartContract: ts.ClassDeclaration;
  readonly context: Context;
}

export const transpile = ({ smartContract, context }: TranspileOptions): TranspileResult => {
  const transpiler = new NEOTranspiler(context, smartContract);

  return transpiler.process();
};
