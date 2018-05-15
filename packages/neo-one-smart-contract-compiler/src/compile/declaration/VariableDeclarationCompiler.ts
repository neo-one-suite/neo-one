import { SyntaxKind, VariableDeclaration } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableDeclarationCompiler extends NodeCompiler<
  VariableDeclaration
> {
  public readonly kind: SyntaxKind = SyntaxKind.VariableDeclaration;

  public visitNode(
    sb: ScriptBuilder,
    node: VariableDeclaration,
    options: VisitOptions,
  ): void {
    const name = sb.scope.add(node.getName());
    const expr = node.getInitializer();
    if (expr != null) {
      sb.visit(expr, sb.pushValueOptions(options));
      sb.scope.set(sb, node, options, name);
    }
  }
}
