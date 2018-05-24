import {
  BinaryExpression,
  Node,
  Expression,
  SyntaxKind,
  ts,
} from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as typeUtils from '../../typeUtils';
import { Helper } from '../helper';
import { TypedHelperOptions } from '../helper/common';

type ExpressionOperatorKind =
  | ts.BitwiseOperatorOrHigher
  | SyntaxKind.CommaToken;
export default class BinaryExpressionCompiler extends NodeCompiler<
  BinaryExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.BinaryExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: BinaryExpression,
    options: VisitOptions,
  ): void {
    const kind = expr.getOperatorToken().getKind() as ts.BinaryOperator;

    switch (kind) {
      case SyntaxKind.EqualsToken:
      case SyntaxKind.PlusEqualsToken:
      case SyntaxKind.MinusEqualsToken:
      case SyntaxKind.AsteriskAsteriskEqualsToken:
      case SyntaxKind.AsteriskEqualsToken:
      case SyntaxKind.SlashEqualsToken:
      case SyntaxKind.PercentEqualsToken:
      case SyntaxKind.AmpersandEqualsToken:
      case SyntaxKind.BarEqualsToken:
      case SyntaxKind.CaretEqualsToken:
      case SyntaxKind.LessThanLessThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case SyntaxKind.GreaterThanGreaterThanEqualsToken:
        this.visitAssignmentOperator(sb, kind, expr, options);
        break;
      case SyntaxKind.AsteriskToken:
      case SyntaxKind.SlashToken:
      case SyntaxKind.PercentToken:
      case SyntaxKind.PlusToken:
      case SyntaxKind.MinusToken:
      case SyntaxKind.GreaterThanGreaterThanToken:
      case SyntaxKind.LessThanLessThanToken:
      case SyntaxKind.LessThanToken:
      case SyntaxKind.LessThanEqualsToken:
      case SyntaxKind.GreaterThanToken:
      case SyntaxKind.GreaterThanEqualsToken:
      case SyntaxKind.ExclamationEqualsToken:
      case SyntaxKind.EqualsEqualsToken:
      case SyntaxKind.AmpersandToken:
      case SyntaxKind.BarToken:
      case SyntaxKind.CaretToken:
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      case SyntaxKind.InKeyword:
      case SyntaxKind.InstanceOfKeyword:
      case SyntaxKind.CommaToken:
      case SyntaxKind.AsteriskAsteriskToken:
      case SyntaxKind.EqualsEqualsEqualsToken:
      case SyntaxKind.ExclamationEqualsEqualsToken:
        this.visitExpressionOperator(sb, kind, expr, options);
        break;
      case SyntaxKind.AmpersandAmpersandToken:
      case SyntaxKind.BarBarToken:
        this.visitLogicalExpressionOperator(sb, kind, expr, options);
        break;
      default:
        sb.assertUnreachable(kind);
    }
  }

  private visitAssignmentOperator(
    sb: ScriptBuilder,
    kind: ts.AssignmentOperator,
    expr: BinaryExpression,
    options: VisitOptions,
  ): void {
    const left = expr.getLeft();
    const right = expr.getRight();
    const token = expr.getOperatorToken();
    const pushValueOptions = sb.pushValueOptions(options);
    switch (kind) {
      case SyntaxKind.EqualsToken:
        sb.visit(expr.getRight(), pushValueOptions);
        break;
      case SyntaxKind.PlusEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.PlusToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.MinusEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.MinusToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.AsteriskAsteriskEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.AsteriskAsteriskToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.AsteriskEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.AsteriskToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.SlashEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.SlashToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.PercentEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.PercentToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.AmpersandEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.AmpersandToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.BarEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.BarToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.CaretEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.CaretToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.LessThanLessThanEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.LessThanLessThanToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case SyntaxKind.GreaterThanGreaterThanEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          SyntaxKind.GreaterThanGreaterThanToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      default:
        sb.assertUnreachable(kind);
    }

    sb.visit(expr.getLeft(), sb.setValueOptions(options));
  }

  private visitExpressionOperator(
    sb: ScriptBuilder,
    kind: ExpressionOperatorKind,
    expr: BinaryExpression,
    options: VisitOptions,
  ): void {
    this.visitExpressionOperatorBase(
      sb,
      expr.getOperatorToken(),
      kind,
      expr.getLeft(),
      expr.getRight(),
      options,
    );
  }

  private visitLogicalExpressionOperator(
    sb: ScriptBuilder,
    kind: ts.LogicalOperator,
    expr: BinaryExpression,
    options: VisitOptions,
  ): void {
    this.visitLogicalExpressionOperatorBase(
      sb,
      expr.getOperatorToken(),
      kind,
      expr.getLeft(),
      expr.getRight(),
      options,
    );
  }

  private visitExpressionOperatorBase(
    sb: ScriptBuilder,
    node: Node,
    kind: ExpressionOperatorKind,
    left: Expression,
    right: Expression,
    options: VisitOptions,
  ): void {
    if (!options.pushValue) {
      sb.visit(left, options);
      sb.visit(right, options);
      return;
    }

    const visit = (
      leftHelper: (options: TypedHelperOptions) => Helper<Node>,
      rightHelper?: (options: TypedHelperOptions) => Helper<Node>,
    ) => {
      sb.visit(left, options);
      sb.emitHelper(left, options, leftHelper({ type: sb.getType(left) }));
      sb.visit(right, options);
      sb.emitHelper(
        right,
        options,
        (rightHelper || leftHelper)({ type: sb.getType(right) }),
      );
    };

    const visitNumeric = () => visit(sb.helpers.toNumber);

    const leftType = sb.getType(left);
    const rightType = sb.getType(right);

    const isBinaryNumeric =
      typeUtils.isOnlyNumber(leftType) && typeUtils.isOnlyNumber(rightType);

    switch (kind) {
      case SyntaxKind.AsteriskToken:
        visitNumeric();
        sb.emitOp(node, 'MUL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.SlashToken:
        visitNumeric();
        sb.emitOp(node, 'DIV');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.PercentToken:
        visitNumeric();
        sb.emitOp(node, 'MOD');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.PlusToken:
        if (isBinaryNumeric) {
          visitNumeric();
          sb.emitOp(node, 'ADD');
          sb.emitHelper(node, options, sb.helpers.createNumber);
        } else if (
          typeUtils.isOnlyString(leftType) &&
          typeUtils.isOnlyString(rightType)
        ) {
          visit(() => sb.helpers.getString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (typeUtils.isOnlyString(leftType)) {
          visit(() => sb.helpers.getString, sb.helpers.toString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (typeUtils.isOnlyString(rightType)) {
          visit(sb.helpers.toString, () => sb.helpers.getString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else {
          // [right, left]
          visit(sb.helpers.toPrimitive);
          // [left, right]
          sb.emitOp(node, 'SWAP');
          // [left, right, left]
          sb.emitOp(node, 'TUCK');
          // [right, left, right, left]
          sb.emitOp(node, 'TUCK');
          // [isString, left, right, left]
          sb.emitHelper(node, options, sb.helpers.isString);
          // [left, isString, right, left]
          sb.emitOp(node, 'SWAP');
          // [isString, isString, right, left]
          sb.emitHelper(node, options, sb.helpers.isString);
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [isEitherString, right, left]
                sb.emitOp(node, 'BOOLOR');
              },
              whenTrue: () => {
                // [string0, left]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.toString({ type: sb.getType(right) }),
                );
                // [left, string0]
                sb.emitOp(node, 'SWAP');
                // [string1, string0]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.toString({ type: sb.getType(left) }),
                );
                // [string0, string1]
                sb.emitOp(node, 'SWAP');
                // [string]
                sb.emitOp(node, 'CAT');
                // [string]
                sb.emitHelper(node, options, sb.helpers.createString);
              },
              whenFalse: () => {
                // [number0, left]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.toNumber({ type: sb.getType(right) }),
                );
                // [left, number0]
                sb.emitOp(node, 'SWAP');
                // [number1, number0]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.toNumber({ type: sb.getType(left) }),
                );
                // [number0, number1]
                sb.emitOp(node, 'SWAP');
                // [number]
                sb.emitOp(node, 'ADD');
                // [number]
                sb.emitHelper(node, options, sb.helpers.createNumber);
              },
            }),
          );
        }
        break;
      case SyntaxKind.MinusToken:
        visitNumeric();
        sb.emitOp(node, 'SUB');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.GreaterThanGreaterThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.LessThanLessThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.LessThanToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: true, left, right }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.LessThanEqualsToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: false, left: right, right: left }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.GreaterThanToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: false, left: right, right: left }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.GreaterThanEqualsToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: true, left, right }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.ExclamationEqualsToken:
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.EqualsEqualsToken:
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.AmpersandToken:
        visitNumeric();
        sb.emitOp(node, 'AND');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.BarToken:
        visitNumeric();
        sb.emitOp(node, 'OR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.CaretToken:
        visitNumeric();
        sb.emitOp(node, 'XOR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.InKeyword:
        sb.reportUnsupported(node);
        break;
      case SyntaxKind.InstanceOfKeyword:
        // [left]
        sb.visit(left, options);
        // [right, left]
        sb.visit(right, options);
        // [left instanceof right]
        sb.emitHelper(node, options, sb.helpers.instanceof);
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.CommaToken:
        sb.emitOp(node, 'DROP');
        break;
      case SyntaxKind.AsteriskAsteriskToken:
        sb.reportUnsupported(node);
        break;
      case SyntaxKind.EqualsEqualsEqualsToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.equalsEqualsEquals({ left, right }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.ExclamationEqualsEqualsToken:
        sb.emitHelper(
          node,
          options,
          sb.helpers.equalsEqualsEquals({ left, right }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      default:
        sb.assertUnreachable(kind);
    }
  }

  private visitLogicalExpressionOperatorBase(
    sb: ScriptBuilder,
    node: Node,
    kind: ts.LogicalOperator,
    left: Expression,
    right: Expression,
    options: VisitOptions,
  ): void {
    switch (kind) {
      case SyntaxKind.AmpersandAmpersandToken: {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [left]
              sb.visit(left, sb.pushValueOptions(options));
              if (options.pushValue) {
                // [left, left]
                sb.emitOp(left, 'DUP');
              }
              // [leftBoolean, ?left]
              sb.emitHelper(
                left,
                sb.pushValueOptions(options),
                sb.helpers.toBoolean({ type: sb.getType(left) }),
              );
            },
            whenTrue: () => {
              if (options.pushValue) {
                sb.emitOp(node, 'DROP');
              }
              sb.visit(right, options);
            },
          }),
        );
        break;
      }
      case SyntaxKind.BarBarToken: {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [left]
              sb.visit(left, sb.pushValueOptions(options));
              if (options.pushValue) {
                // [left, left]
                sb.emitOp(left, 'DUP');
              }
              // [leftBoolean, ?left]
              sb.emitHelper(
                left,
                sb.pushValueOptions(options),
                sb.helpers.toBoolean({ type: sb.getType(left) }),
              );
            },
            whenFalse: () => {
              if (options.pushValue) {
                sb.emitOp(node, 'DROP');
              }
              sb.visit(right, options);
            },
          }),
        );
        break;
      }
      default:
        sb.assertUnreachable(kind);
    }
  }
}
