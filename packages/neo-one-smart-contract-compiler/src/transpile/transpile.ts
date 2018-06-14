import Project, { ClassDeclaration } from 'ts-simple-ast';

import { Context } from '../Context';
import { getGlobals, getLibAliases, getLibs } from '../symbols';
import { NEOTranspiler } from './transpiler';
import { TranspileResult } from './types';

export interface TranspileOptions {
  readonly ast: Project;
  readonly smartContract: ClassDeclaration;
  readonly context?: Context;
}

export const transpile = ({
  ast,
  smartContract,
  context = new Context(getGlobals(ast), getLibs(ast), getLibAliases(ast)),
}: TranspileOptions): TranspileResult => {
  const transpiler = new NEOTranspiler(context, ast, smartContract);

  return transpiler.process();
};
