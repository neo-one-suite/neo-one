import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

type AssignmentLike = ts.SyntaxKind.PlusPlusToken | ts.SyntaxKind.MinusMinusToken;
type ValueLike =
  | ts.SyntaxKind.PlusToken
  | ts.SyntaxKind.MinusToken
  | ts.SyntaxKind.TildeToken
  | ts.SyntaxKind.ExclamationToken;
export class PrefixUnaryExpressionCompiler extends NodeCompiler<ts.PrefixUnaryExpression> {
  public readonly kind = ts.SyntaxKind.PrefixUnaryExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PrefixUnaryExpression, options: VisitOptions): void {
    const token = tsUtils.expression.getOperator(expr);
    switch (token) {
      case ts.SyntaxKind.PlusPlusToken:
      case ts.SyntaxKind.MinusMinusToken:
        this.visitAssignment(sb, token, expr, options);
        break;
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.TildeToken:
      case ts.SyntaxKind.ExclamationToken:
        this.visitValue(sb, token, expr, options);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(token);
    }
  }

  private visitAssignment(
    sb: ScriptBuilder,
    token: AssignmentLike,
    expr: ts.PrefixUnaryExpression,
    options: VisitOptions,
  ): void {
    sb.visit(tsUtils.expression.getOperand(expr), sb.noSetValueOptions(sb.pushValueOptions(options)));

    switch (token) {
      case ts.SyntaxKind.PlusPlusToken:
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.toNumber({ type: sb.getType(expr) }));
        sb.emitOp(expr, 'INC');
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.MinusMinusToken:
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.toNumber({ type: sb.getType(expr) }));
        sb.emitOp(expr, 'DEC');
        sb.emitHelper(expr, sb.pushValueOptions(options), sb.helpers.createNumber);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(token);
    }

    sb.visit(tsUtils.expression.getOperand(expr), sb.setValueOptions(options));
  }

  private visitValue(sb: ScriptBuilder, token: ValueLike, expr: ts.PrefixUnaryExpression, options: VisitOptions): void {
    const operand = tsUtils.expression.getOperand(expr);
    sb.visit(operand, sb.noSetValueOptions(sb.pushValueOptions(options)));
    if (!options.pushValue) {
      sb.emitOp(expr, 'DROP');

      return;
    }

    switch (token) {
      case ts.SyntaxKind.PlusToken:
        sb.emitHelper(expr, options, sb.helpers.toNumber({ type: sb.getType(expr) }));
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.MinusToken:
        sb.emitHelper(expr, options, sb.helpers.toNumber({ type: sb.getType(expr) }));
        sb.emitOp(expr, 'NEGATE');
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.TildeToken:
        sb.emitHelper(expr, options, sb.helpers.toNumber({ type: sb.getType(expr) }));
        sb.emitOp(expr, 'INVERT');
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.ExclamationToken:
        sb.emitHelper(operand, options, sb.helpers.toBoolean({ type: sb.getType(operand) }));
        sb.emitOp(expr, 'NOT');
        sb.emitHelper(operand, options, sb.helpers.createBoolean);
        break;
      default:
        /* istanbul ignore next */
        utils.assertNever(token);
    }
  }
}
