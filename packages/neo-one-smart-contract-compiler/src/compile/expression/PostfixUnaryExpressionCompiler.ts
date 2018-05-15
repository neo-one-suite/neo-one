import { PostfixUnaryExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

type AssignmentLike = SyntaxKind.PlusPlusToken | SyntaxKind.MinusMinusToken;
export default class PostfixUnaryExpressionCompiler extends NodeCompiler<
  PostfixUnaryExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.PostfixUnaryExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: PostfixUnaryExpression,
    options: VisitOptions,
  ): void {
    sb.visit(
      expr.getOperand(),
      sb.noSetValueOptions(sb.pushValueOptions(options)),
    );
    const token = expr.getOperatorToken();
    switch (token) {
      case SyntaxKind.PlusPlusToken:
      case SyntaxKind.MinusMinusToken:
        this.visitAssignment(sb, token, expr, options);
        break;
      default:
        sb.assertUnreachable(token);
    }
  }

  private visitAssignment(
    sb: ScriptBuilder,
    token: AssignmentLike,
    expr: PostfixUnaryExpression,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      sb.emitOp(expr, 'DUP');
    }

    switch (token) {
      case SyntaxKind.PlusPlusToken:
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.toNumber({
            type: sb.getType(expr),
          }),
        );
        sb.emitOp(expr, 'INC');
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.createNumber,
        );
        break;
      case SyntaxKind.MinusMinusToken:
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.toNumber({
            type: sb.getType(expr),
          }),
        );
        sb.emitOp(expr, 'DEC');
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.createNumber,
        );
        break;
      default:
        sb.assertUnreachable(token);
    }

    sb.visit(
      expr.getOperand(),
      sb.noPushValueOptions(sb.setValueOptions(options)),
    );
  }
}
