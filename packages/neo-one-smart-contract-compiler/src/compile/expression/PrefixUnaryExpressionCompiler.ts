import { PrefixUnaryExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

type AssignmentLike = SyntaxKind.PlusPlusToken | SyntaxKind.MinusMinusToken;
type ValueLike =
  | SyntaxKind.PlusToken
  | SyntaxKind.MinusToken
  | SyntaxKind.TildeToken
  | SyntaxKind.ExclamationToken;
export default class PrefixUnaryExpressionCompiler extends NodeCompiler<
  PrefixUnaryExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.PrefixUnaryExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: PrefixUnaryExpression,
    options: VisitOptions,
  ): void {
    const token = expr.getOperatorToken();
    switch (token) {
      case SyntaxKind.PlusPlusToken:
      case SyntaxKind.MinusMinusToken:
        this.visitAssignment(sb, token, expr, options);
        break;
      case SyntaxKind.PlusToken:
      case SyntaxKind.MinusToken:
      case SyntaxKind.TildeToken:
      case SyntaxKind.ExclamationToken:
        this.visitValue(sb, token, expr, options);
        break;
      default:
        sb.assertUnreachable(token);
    }
  }

  private visitAssignment(
    sb: ScriptBuilder,
    token: AssignmentLike,
    expr: PrefixUnaryExpression,
    options: VisitOptions,
  ): void {
    sb.visit(
      expr.getOperand(),
      sb.noSetValueOptions(sb.pushValueOptions(options)),
    );

    switch (token) {
      case SyntaxKind.PlusPlusToken:
        sb.emitHelper(
          expr,
          sb.pushValueOptions(options),
          sb.helpers.toNumber({ type: sb.getType(expr) }),
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
          sb.helpers.toNumber({ type: sb.getType(expr) }),
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

    sb.visit(expr.getOperand(), sb.setValueOptions(options));
  }

  private visitValue(
    sb: ScriptBuilder,
    token: ValueLike,
    expr: PrefixUnaryExpression,
    options: VisitOptions,
  ): void {
    const operand = expr.getOperand();
    sb.visit(operand, sb.noSetValueOptions(sb.pushValueOptions(options)));
    if (!options.pushValue) {
      sb.emitOp(expr, 'DROP');
      return;
    }

    switch (token) {
      case SyntaxKind.PlusToken:
        sb.emitHelper(
          expr,
          options,
          sb.helpers.toNumber({ type: sb.getType(expr) }),
        );
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.MinusToken:
        sb.emitHelper(
          expr,
          options,
          sb.helpers.toNumber({ type: sb.getType(expr) }),
        );
        sb.emitOp(expr, 'NEGATE');
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.TildeToken:
        sb.emitHelper(
          expr,
          options,
          sb.helpers.toNumber({ type: sb.getType(expr) }),
        );
        sb.emitOp(expr, 'INVERT');
        sb.emitHelper(expr, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.ExclamationToken:
        sb.emitHelper(
          operand,
          options,
          sb.helpers.toBoolean({ type: sb.getType(operand) }),
        );
        sb.emitOp(expr, 'NOT');
        sb.emitHelper(operand, options, sb.helpers.createBoolean);
        break;
      default:
        sb.assertUnreachable(token);
    }
  }
}
