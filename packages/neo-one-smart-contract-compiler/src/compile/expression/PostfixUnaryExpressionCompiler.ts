import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

type AssignmentLike = ts.SyntaxKind.PlusPlusToken | ts.SyntaxKind.MinusMinusToken;
export class PostfixUnaryExpressionCompiler extends NodeCompiler<ts.PostfixUnaryExpression> {
  public readonly kind = ts.SyntaxKind.PostfixUnaryExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PostfixUnaryExpression, options: VisitOptions): void {
    sb.visit(tsUtils.expression.getOperand(expr), sb.noSetValueOptions(sb.pushValueOptions(options)));
    const token = tsUtils.expression.getOperator(expr);
    switch (token) {
      case ts.SyntaxKind.PlusPlusToken:
      case ts.SyntaxKind.MinusMinusToken:
        this.visitAssignment(sb, token, expr, options);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(token);
    }
  }

  private visitAssignment(
    sb: ScriptBuilder,
    token: AssignmentLike,
    expr: ts.PostfixUnaryExpression,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      sb.emitOp(expr, 'DUP');
    }

    switch (token) {
      case ts.SyntaxKind.PlusPlusToken:
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.toNumber({
            type: sb.getType(expr),
          }),
        );
        sb.emitOp(expr, 'INC');
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.MinusMinusToken:
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.toNumber({
            type: sb.getType(expr),
          }),
        );
        sb.emitOp(expr, 'DEC');
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.createNumber);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(token);
    }

    sb.visit(tsUtils.expression.getOperand(expr), sb.noPushValueOptions(sb.setValueOptions(options)));
  }
}
