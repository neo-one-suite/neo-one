import Ast, { ClassDeclaration } from 'ts-simple-ast';

import { TranspileResult } from './types';
import { Context } from '../Context';
import { getGlobals, getLibs, getLibAliases } from '../symbols';
import { NEOTranspiler } from './transpiler';

export interface TranspileOptions {
  readonly ast: Ast;
  readonly smartContract: ClassDeclaration;
  readonly context?: Context;
}

export const transpile = ({
  ast,
  smartContract,
  context: contextIn,
}: TranspileOptions): TranspileResult => {
  const context =
    contextIn || new Context(getGlobals(ast), getLibs(ast), getLibAliases(ast));
  const transpiler = new NEOTranspiler(context, ast, smartContract);

  return transpiler.process();
};
