import { ParenthesizedExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ParenthesizedExpressionCompiler extends NodeCompiler<ParenthesizedExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.ParenthesizedExpression;

  public visitNode(sb: ScriptBuilder, expr: ParenthesizedExpression, options: VisitOptions): void {
    sb.visit(expr.getExpression(), options);
  }
}
