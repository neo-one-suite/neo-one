import { ReturnStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ReturnStatementCompiler extends NodeCompiler<ReturnStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ReturnStatement;

  public visitNode(sb: ScriptBuilder, node: ReturnStatement, options: VisitOptions): void {
    const expr = node.getExpression();
    if (expr === undefined) {
      sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createUndefined);
    } else {
      sb.visit(expr, sb.pushValueOptions(options));
    }

    sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createNormalCompletion);
    sb.emitOp(node, 'RET');
  }
}
