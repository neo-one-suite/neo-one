import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableDeclarationListCompiler extends NodeCompiler<ts.VariableDeclarationList> {
  public readonly kind = ts.SyntaxKind.VariableDeclarationList;

  public visitNode(sb: ScriptBuilder, node: ts.VariableDeclarationList, options: VisitOptions): void {
    tsUtils.variable.getDeclarations(node).forEach((decl) => {
      sb.visit(decl, options);
    });
  }
}
