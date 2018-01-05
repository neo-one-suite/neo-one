import { CatchClause, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CatchClauseCompiler extends NodeCompiler<CatchClause> {
  public readonly kind: SyntaxKind = SyntaxKind.CatchClause;

  public visitNode(
    sb: ScriptBuilder,
    node: CatchClause,
    options: VisitOptions,
  ): void {
    const variable = node.getVariableDeclaration();
    if (variable == null) {
      sb.visit(node.getBlock(), options);
    } else {
      sb.withScope(node, options, (innerOptions) => {
        sb.visit(variable, innerOptions);
        sb.visit(node.getBlock(), innerOptions);
      });
    }
  }
}
