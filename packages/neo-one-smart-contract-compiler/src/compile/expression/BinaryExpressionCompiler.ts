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
        // Tested
        sb.visit(expr.getRight(), pushValueOptions);
        break;
      case SyntaxKind.PlusEqualsToken:
        // Tested
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
        // Tested
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
        // SKIPPED Test: Unsupported
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
        // Tested
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
        // Tested
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
        // Tested
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
        // Tested
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
        // Tested
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
        // Tested
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
        // Tested
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
        // NOT TESTED
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
        // Tested
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
        // Tested
        visitNumeric();
        sb.emitOp(node, 'MUL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.SlashToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'DIV');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.PercentToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'MOD');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.PlusToken:
        // Tested: PlusToken:StringConcatenation:StrLeftIntRight
        if (isBinaryNumeric) {
          visitNumeric();
          sb.emitOp(node, 'ADD');
          sb.emitHelper(node, options, sb.helpers.createNumber);
        } else if (
          typeUtils.isOnlyString(leftType) &&
          typeUtils.isOnlyString(rightType)
        ) {
          // Tested: PlusToken:binaryNumeric
          visit(() => sb.helpers.getString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (typeUtils.isOnlyString(leftType)) {
          // SKIPPED: failing test: PlusToken:StringConcatenation:StrLeftIntRight
          visit(() => sb.helpers.getString, sb.helpers.toString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else if (typeUtils.isOnlyString(rightType)) {
          // SKIPPED: failing test: PlusToken:StringConcatenation:IntLeftStrRight
          visit(sb.helpers.toString, () => sb.helpers.getString);
          sb.emitOp(node, 'CAT');
          sb.emitHelper(node, options, sb.helpers.createString);
        } else {
          // NOT TESTED
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
                //  [number]
                sb.emitOp(node, 'ADD');
                //  [number]
                sb.emitHelper(node, options, sb.helpers.createNumber);
              },
            }),
          );
        }
        break;
      case SyntaxKind.MinusToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'SUB');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.GreaterThanGreaterThanToken:
        // SKIPPED: failing test
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        // SKIPPED: failing test
        visitNumeric();
        sb.emitOp(node, 'SHR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.LessThanLessThanToken:
        // SKIPPED: failing test
        visitNumeric();
        sb.emitOp(node, 'SHL');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.LessThanToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: true, left, right }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.LessThanEqualsToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: false, left: right, right: left }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.GreaterThanToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: false, left: right, right: left }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.GreaterThanEqualsToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.lessThan({ leftFirst: true, left, right }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.ExclamationEqualsToken:
        // Tested, but skipping some relating to null, true & false
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.EqualsEqualsToken:
        // Tested, but skipping some relating to null, true & false
        sb.emitHelper(node, options, sb.helpers.equalsEquals({ left, right }));
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.AmpersandToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'AND');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.BarToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'OR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.CaretToken:
        // Tested
        visitNumeric();
        sb.emitOp(node, 'XOR');
        sb.emitHelper(node, options, sb.helpers.createNumber);
        break;
      case SyntaxKind.InKeyword:
        // SKIPPED Test: Unsupported
        sb.reportUnsupported(node);
        break;
      case SyntaxKind.InstanceOfKeyword:
        // Tested
        // [left]
        sb.visit(left, options);
        // [right, left]
        sb.visit(right, options);
        // [left instanceof right]
        sb.emitHelper(node, options, sb.helpers.instanceof);
        // [booleanVal]
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.CommaToken:
        sb.emitOp(node, 'DROP');
        break;
      case SyntaxKind.AsteriskAsteriskToken:
        // SKIPPED Test: Unsupported
        sb.reportUnsupported(node);
        break;
      case SyntaxKind.EqualsEqualsEqualsToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.equalsEqualsEquals({ left, right }),
        );
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      case SyntaxKind.ExclamationEqualsEqualsToken:
        // Tested
        sb.emitHelper(
          node,
          options,
          sb.helpers.equalsEqualsEquals({ left, right }),
        );
        sb.emitOp(node, 'NOT');
        sb.emitHelper(node, options, sb.helpers.createBoolean);
        break;
      default:
        // NOT TESTED
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
        // Tested
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
        // Tested
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
        // NOT TESTED
        sb.assertUnreachable(kind);
    }
  }
}
