import { SyntaxKind, ThrowStatement } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ThrowStatementCompiler extends NodeCompiler<ThrowStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ThrowStatement;

  public visitNode(sb: ScriptBuilder, node: ThrowStatement, options: VisitOptions): void {
    const expr = node.getExpression();
    sb.visit(expr, sb.pushValueOptions(options));
    sb.emitHelper(node, options, sb.helpers.throw);
  }
}
