import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import { Helper } from '../helper';
import { TypedHelperOptions } from '../helper/common';

type ExpressionOperatorKind = ts.BitwiseOperatorOrHigher | ts.SyntaxKind.CommaToken;
export class BinaryExpressionCompiler extends NodeCompiler<ts.BinaryExpression> {
  public readonly kind = ts.SyntaxKind.BinaryExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.BinaryExpression, options: VisitOptions): void {
    const kind = tsUtils.expression.getOperatorToken(expr).kind;

    switch (kind) {
      case ts.SyntaxKind.EqualsToken:
      case ts.SyntaxKind.PlusEqualsToken:
      case ts.SyntaxKind.MinusEqualsToken:
      case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      case ts.SyntaxKind.AsteriskEqualsToken:
      case ts.SyntaxKind.SlashEqualsToken:
      case ts.SyntaxKind.PercentEqualsToken:
      case ts.SyntaxKind.AmpersandEqualsToken:
      case ts.SyntaxKind.BarEqualsToken:
      case ts.SyntaxKind.CaretEqualsToken:
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        this.visitAssignmentOperator(sb, kind, expr, options);
        break;
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.SlashToken:
      case ts.SyntaxKind.PercentToken:
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
      case ts.SyntaxKind.LessThanLessThanToken:
      case ts.SyntaxKind.LessThanToken:
      case ts.SyntaxKind.LessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanToken:
      case ts.SyntaxKind.GreaterThanEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.AmpersandToken:
      case ts.SyntaxKind.BarToken:
      case ts.SyntaxKind.CaretToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      case ts.SyntaxKind.InKeyword:
      case ts.SyntaxKind.InstanceOfKeyword:
      case ts.SyntaxKind.CommaToken:
      case ts.SyntaxKind.AsteriskAsteriskToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        this.visitExpressionOperator(sb, kind, expr, options);
        break;
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
        this.visitLogicalExpressionOperator(sb, kind, expr, options);
        break;
      default:
        sb.reportUnsupported(expr);
    }
  }

  private visitAssignmentOperator(
    sb: ScriptBuilder,
    kind: ts.AssignmentOperator,
    expr: ts.BinaryExpression,
    options: VisitOptions,
  ): void {
    const left = tsUtils.expression.getLeft(expr);
    const right = tsUtils.expression.getRight(expr);
    const token = tsUtils.expression.getOperatorToken(expr);
    const pushValueOptions = sb.pushValueOptions(options);
    switch (kind) {
      case ts.SyntaxKind.EqualsToken:
        sb.visit(right, pushValueOptions);
        break;
      case ts.SyntaxKind.PlusEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.PlusToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.MinusEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.MinusToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
        // SKIPPED Test: Unsupported
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.AsteriskAsteriskToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.AsteriskEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.AsteriskToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.SlashEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.SlashToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.PercentEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.PercentToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.AmpersandEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.AmpersandToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.BarEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.BarToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.CaretEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.CaretToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
        this.visitExpressionOperatorBase(sb, token, ts.SyntaxKind.LessThanLessThanToken, left, right, pushValueOptions);
        break;
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        // NOT TESTED
        this.visitExpressionOperatorBase(
          sb,
          token,
          ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        this.visitExpressionOperatorBase(
          sb,
          token,
          ts.SyntaxKind.GreaterThanGreaterThanToken,
          left,
          right,
          pushValueOptions,
        );
        break;
      default:
        utils.assertNever(kind);
    }

    sb.visit(tsUtils.expression.getLeft(expr), sb.setValueOptions(options));
  }

  private visitExpressionOperator(
    sb: ScriptBuilder,
    kind: ExpressionOperatorKind,
    expr: ts.BinaryExpression,
    options: VisitOptions,
  ): void {
    this.visitExpressionOperatorBase(
      sb,
      tsUtils.expression.getOperatorToken(expr),
      kind,
      tsUtils.expression.getLeft(expr),
      tsUtils.expression.getRight(expr),
      options,
    );
  }

  private visitLogicalExpressionOperator(
    sb: ScriptBuilder,
    kind: ts.LogicalOperator,
    expr: ts.BinaryExpression,
    options: VisitOptions,
  ): void {
    this.visitLogicalExpressionOperatorBase(
      sb,
      tsUtils.expression.getOperatorToken(expr),
      kind,
      tsUtils.expression.getLeft(expr),
      tsUtils.expression.getRight(expr),
      options,
    );
  }

  // tslint:disable-next-line cyclomatic-complexity
  private visitExpressionOperatorBase(
    sb: ScriptBuilder,
    node: ts.Node,
    kind: ExpressionOperatorKind,
    left: ts.Expression,
    right: ts.Expression,
    options: VisitOptions,
  ): void {
    if (!options.pushValue) {
      sb.visit(left, options);
      sb.visit(right, options);

      return;
    }

    const leftType = sb.getType(left);
    const rightType = sb.getType(right);

    const visit = (
      leftHelper: (options: TypedHelperOptions) => Helper,
      rightHelper?: (options: TypedHelperOptions) => Helper,
    ) => {
      sb.visit(left, options);
      sb.emitHelper(left, options, leftHelper({ type: leftType }));
      sb.visit(right, options);
      sb.emitHelper(right, options, (rightHelper === undefined ? leftHelper : rightHelper)({ type: rightType }));
    };

    const visitNumeric = () => visit(sb.helpers.toNumber);

    const isBinaryNumeric =
      leftType !== undefined &&
      tsUtils.type_.isOnlyNumberish(leftType) &&
      rightType !== undefined &&
      tsUtils.type_.isOnlyNumberish(rightType);

    switch (kind) {
      case ts.SyntaxKind.AsteriskToken:
        visitNumeric();
        sb.emitOp(node, 'MUL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.SlashToken:
        visitNumeric();
        sb.emitOp(node, 'DIV');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.PercentToken:
        visitNumeric();
        sb.emitOp(node, 'MOD');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.PlusToken:
        if (isBinaryNumeric) {
          visitNumeric();
          sb.emitOp(node, 'ADD');
          sb.emitHelper(node, options, sb.helpers.createNumber);
        } else if (
          leftType !== undefined &&
          tsUtils.type_.isOnlyStringish(leftType) &&
          rightType !== undefined &&
          tsUtils.type_.isOnlyStringish(rightType)
        ) {
          visit(() => sb.helpers.getString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (leftType !== undefined && tsUtils.type_.isOnlyStringish(leftType)) {
          visit(() => sb.helpers.getString, sb.helpers.toString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (rightType !== undefined && tsUtils.type_.isOnlyStringish(rightType)) {
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
          sb.emitOp(node, 'OVER');
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
                sb.emitHelper(node, options, sb.helpers.toString({ type: sb.getType(right) }));
                // [left, string0]
                sb.emitOp(node, 'SWAP');
                // [string1, string0]
                sb.emitHelper(node, options, sb.helpers.toString({ type: sb.getType(left) }));
                // [string0, string1]
                sb.emitOp(node, 'SWAP');
                // [string]
                sb.emitOp(node, 'CAT');
                // [string]
                sb.emitHelper(node, options, sb.helpers.createString);
              },
              whenFalse: () => {
                // [number0, left]
                sb.emitHelper(node, options, sb.helpers.toNumber({ type: sb.getType(right) }));
                // [left, number0]
                sb.emitOp(node, 'SWAP');
                // [number1, number0]
                sb.emitHelper(node, options, sb.helpers.toNumber({ type: sb.getType(left) }));
                // [number0, number1]
                sb.emitOp(node, 'SWAP');
                //  [number]
                sb.emitOp(node, 'ADD');
                //  [number]
                sb.emitHelper(node, options, sb.helpers.createNumber);
              },
            }),
          );
        }
        break;
      case ts.SyntaxKind.MinusToken:
        visitNumeric();
        sb.emitOp(node, 'SUB');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.LessThanLessThanToken:
        visitNumeric();
        sb.emitOp(node, 'SHL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.LessThanToken:
        sb.emitHelper(node, options, sb.helpers.lessThan({ leftFirst: true, left, right }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.LessThanEqualsToken:
        sb.emitHelper(node, options, sb.helpers.lessThan({ leftFirst: false, left: right, right: left }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.GreaterThanToken:
        sb.emitHelper(node, options, sb.helpers.lessThan({ leftFirst: false, left: right, right: left }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.GreaterThanEqualsToken:
        sb.emitHelper(node, options, sb.helpers.lessThan({ leftFirst: true, left, right }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.ExclamationEqualsToken:
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.EqualsEqualsToken:
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.AmpersandToken:
        visitNumeric();
        sb.emitOp(node, 'AND');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.BarToken:
        visitNumeric();
        sb.emitOp(node, 'OR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.CaretToken:
        visitNumeric();
        sb.emitOp(node, 'XOR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.InKeyword:
        // [objectVal]
        sb.visit(right, options);
        // [propVal, objectVal]
        sb.visit(left, options);
        // [boolean]
        sb.emitHelper(node, options, sb.helpers.inObjectProperty({ propType: leftType }));
        // [booleanVal]
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.InstanceOfKeyword:
        // [left]
        sb.visit(left, options);
        // [right, left]
        sb.visit(right, options);
        // [left instanceof right]
        sb.emitHelper(node, options, sb.helpers.instanceof);
        // [booleanVal]
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.CommaToken:
        // [left]
        sb.visit(left, options);
        // []
        sb.emitOp(node, 'DROP');
        // [right]
        sb.visit(right, options);
        break;
      case ts.SyntaxKind.AsteriskAsteriskToken:
        // [right, left]
        visitNumeric();
        sb.emitHelper(node, options, sb.helpers.exp);
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        sb.visit(left, options);
        sb.visit(right, options);
        sb.emitHelper(node, options, sb.helpers.equalsEqualsEquals({ leftType, rightType }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        sb.visit(left, options);
        sb.visit(right, options);
        sb.emitHelper(node, options, sb.helpers.equalsEqualsEquals({ leftType, rightType }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      default:
        utils.assertNever(kind);
    }
  }

  private visitLogicalExpressionOperatorBase(
    sb: ScriptBuilder,
    node: ts.Node,
    kind: ts.LogicalOperator,
    left: ts.Expression,
    right: ts.Expression,
    options: VisitOptions,
  ): void {
    switch (kind) {
      case ts.SyntaxKind.AmpersandAmpersandToken: {
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
              sb.emitHelper(left, sb.pushValueOptions(options), sb.helpers.toBoolean({ type: sb.getType(left) }));
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
      case ts.SyntaxKind.BarBarToken: {
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
              sb.emitHelper(left, sb.pushValueOptions(options), sb.helpers.toBoolean({ type: sb.getType(left) }));
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
        utils.assertNever(kind);
    }
  }
}
