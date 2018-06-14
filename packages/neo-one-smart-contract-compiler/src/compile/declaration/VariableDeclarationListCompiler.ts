import { SyntaxKind, VariableDeclarationList } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableDeclarationListCompiler extends NodeCompiler<VariableDeclarationList> {
  public readonly kind: SyntaxKind = SyntaxKind.VariableDeclarationList;

  public visitNode(sb: ScriptBuilder, node: VariableDeclarationList, options: VisitOptions): void {
    node.getDeclarations().forEach((decl) => {
      sb.visit(decl, options);
    });
  }
}
