import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface EqualsEqualsHelperOptions {
  readonly left: ts.Node;
  readonly right: ts.Node;
}

// Input: []
// Output: [boolean]
export class EqualsEqualsHelper extends Helper {
  private readonly left: ts.Node;
  private readonly right: ts.Node;

  public constructor(options: EqualsEqualsHelperOptions) {
    super();
    this.left = options.left;
    this.right = options.right;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.visit(this.left, options);
      sb.visit(this.right, options);

      return;
    }

    const leftType = sb.getType(this.left);
    const rightType = sb.getType(this.right);
    if (leftType !== undefined && rightType !== undefined) {
      this.equalsEqualsType(sb, node, options, leftType, rightType);
    } else {
      this.equalsEqualsUnknown(sb, node, options);
    }
  }

  public equalsEqualsType(
    sb: ScriptBuilder,
    node: ts.Node,
    options: VisitOptions,
    leftType: ts.Type,
    rightType: ts.Type,
  ): void {
    if (
      tsUtils.type_.isOnly(leftType) &&
      tsUtils.type_.isOnly(rightType) &&
      tsUtils.type_.isSame(leftType, rightType)
    ) {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEquals({ leftType, rightType }));
    } else if (
      (tsUtils.type_.hasNull(leftType) || tsUtils.type_.hasUndefined(leftType)) &&
      (tsUtils.type_.isOnlyUndefined(rightType) || tsUtils.type_.isOnlyNull(rightType))
    ) {
      // [left]
      sb.visit(this.left, options);
      // [left]
      sb.visit(this.right, sb.noPushValueOptions(options));
      // [equals]
      sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
    } else if (
      tsUtils.type_.isOnlyNumberish(leftType) &&
      (tsUtils.type_.isOnlyStringish(rightType) || tsUtils.type_.isOnlyBooleanish(rightType))
    ) {
      // [left]
      sb.visit(this.left, options);
      // [right, left]
      sb.visit(this.right, options);
      // [equals]
      this.equalsEqualsLeftNumberRightBooleanOrString(sb, node, options);
    } else if (
      tsUtils.type_.isOnlyBooleanish(leftType) &&
      (tsUtils.type_.isOnlyStringish(rightType) || tsUtils.type_.isOnlyBooleanish(rightType))
    ) {
      // [left]
      sb.visit(this.left, options);
      // [leftNumber]
      sb.emitHelper(this.left, options, sb.helpers.toNumber({ type: sb.getType(this.left) }));
      // [leftNumberVal]
      sb.emitHelper(this.left, options, sb.helpers.createNumber);
      // [right, leftNumberVal]
      sb.visit(this.right, options);
      // [equals]
      this.equalsEqualsLeftNumberRightBooleanOrString(sb, node, options);
    } else if (
      (tsUtils.type_.isOnlyStringish(leftType) || tsUtils.type_.isOnlyBooleanish(leftType)) &&
      tsUtils.type_.isOnlyNumberish(rightType)
    ) {
      // [left]
      sb.visit(this.left, options);
      // [right, left]
      sb.visit(this.right, options);
      // [equals]
      this.equalsEqualsRightNumberLeftBooleanOrString(sb, node, options);
    } else if (
      (tsUtils.type_.isOnlyStringish(leftType) || tsUtils.type_.isOnlyBooleanish(leftType)) &&
      tsUtils.type_.isOnlyBooleanish(rightType)
    ) {
      // [left]
      sb.visit(this.left, options);
      // [right, left]
      sb.visit(this.right, options);
      // [rightNumber, left]
      sb.emitHelper(this.right, options, sb.helpers.toNumber({ type: sb.getType(this.right) }));
      // [rightNumberVal, left]
      sb.emitHelper(this.right, options, sb.helpers.createNumber);
      // [equals]
      this.equalsEqualsRightNumberLeftBooleanOrString(sb, node, options);
    } else {
      this.equalsEqualsUnknown(sb, node, options);
    }
  }

  public equalsEqualsLeftNumberRightBooleanOrString(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [rightNumber, left]
    sb.emitHelper(this.right, options, sb.helpers.toNumber({ type: sb.getType(this.right) }));
    // [rightNumber, left]
    sb.emitHelper(this.right, options, sb.helpers.createNumber);
    // [equals]
    sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsNumber);
  }

  public equalsEqualsRightNumberLeftBooleanOrString(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [left, right]
    sb.emitOp(node, 'SWAP');
    // [leftNumber, right]
    sb.emitHelper(this.left, options, sb.helpers.toNumber({ type: sb.getType(this.left) }));
    // [leftNumber, right]
    sb.emitHelper(this.left, options, sb.helpers.createNumber);
    // [right, leftNumber]
    sb.emitOp(node, 'SWAP');
    // [equals]
    sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsNumber);
  }

  public equalsEqualsUnknown(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const copy = () => {
      // [left, right]
      sb.emitOp(this.right, 'SWAP');
      // [left, right, left]
      sb.emitOp(this.right, 'TUCK');
      // [right, left, right, left]
      sb.emitOp(this.right, 'OVER');
    };

    // [left]
    sb.visit(this.left, options);
    // [right, left]
    sb.visit(this.right, options);

    const cases = [
      {
        condition: () => {
          copy();
          // [right, left]
          sb.emitHelper(node, options, sb.helpers.isSameType);
        },
        whenTrue: () => {
          sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsSameType);
        },
      },
      {
        condition: () => {
          copy();
          // [rightIsNullOrUndefined, left, right, left]
          sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
          // [left, rightIsNullOrUndefined, right, left]
          sb.emitOp(node, 'SWAP');
          // [leftIsNullOrUndefined, rightIsNullOrUndefined, right, left]
          sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
          // [equals, right, left]
          sb.emitOp(node, 'BOOLOR');
        },
        whenTrue: () => {
          // [isNullOrUndefined, left]
          sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
          // [left, rightIsNullOrUndefined]
          sb.emitOp(node, 'SWAP');
          // [leftIsNullOrUndefined, rightIsNullOrUndefined]
          sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
          // [equals]
          sb.emitOp(node, 'EQUAL');
        },
      },
      {
        condition: () => {
          copy();
          // [right, right, left, right, left]
          sb.emitOp(node, 'DUP');
          // [isString, right, left, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isString);
          // [right, isString, left, right, left]
          sb.emitOp(node, 'SWAP');
          // [isBoolean, isString, left, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isBoolean);
          // [isBooleanOrString, left, right, left]
          sb.emitOp(node, 'BOOLOR');
          // [left, isBooleanOrString, right, left]
          sb.emitOp(node, 'SWAP');
          // [left, left, isBooleanOrString, right, left]
          sb.emitOp(node, 'DUP');
          // [isNumber, left, isBooleanOrString, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isNumber);
          // [left, isNumber, isBooleanOrString, right, left]
          sb.emitOp(node, 'SWAP');
          // [isBoolean, isNumber, isBooleanOrString, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isBoolean);
          // [isBooleanOrNumber, isBooleanOrString, right, left]
          sb.emitOp(node, 'BOOLOR');
          // [is(BooleanOrNumber)And(BooleanOrString), right, left]
          sb.emitOp(node, 'BOOLAND');
        },
        whenTrue: () => {
          // [left, right]
          sb.emitOp(node, 'SWAP');
          // [leftNumber, right]
          sb.emitHelper(node, options, sb.helpers.toNumber({ type: sb.getType(this.left) }));
          // [leftNumber, right]
          sb.emitHelper(node, options, sb.helpers.createNumber);
          // [right, leftNumber]
          sb.emitOp(node, 'SWAP');
          this.equalsEqualsLeftNumberRightBooleanOrString(sb, node, options);
        },
      },
      {
        condition: () => {
          copy();
          // [left, right, right, left]
          sb.emitOp(node, 'SWAP');
          // [left, left, right, right, left]
          sb.emitOp(node, 'DUP');
          // [isString, left, right, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isString);
          // [left, isString, right, right, left]
          sb.emitOp(node, 'SWAP');
          // [isBoolean, isString, right, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isBoolean);
          // [isBooleanOrString, right, right, left]
          sb.emitOp(node, 'BOOLOR');
          // [right, isBooleanOrString, right, left]
          sb.emitOp(node, 'SWAP');
          // [right, right, isBooleanOrString, right, left]
          sb.emitOp(node, 'DUP');
          // [isNumber, right, isBooleanOrString, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isNumber);
          // [right, isNumber, isBooleanOrString, right, left]
          sb.emitOp(node, 'SWAP');
          // [isBoolean, isNumber, isBooleanOrString, right, left]
          sb.emitHelper(this.right, options, sb.helpers.isBoolean);
          // [isBooleanOrNumber, isBooleanOrString, right, left]
          sb.emitOp(node, 'BOOLOR');
          // [is(BooleanOrNumber)And(BooleanOrString), right, left]
          sb.emitOp(node, 'BOOLAND');
        },
        whenTrue: () => {
          // [rightNumber, left]
          sb.emitHelper(node, options, sb.helpers.toNumber({ type: sb.getType(this.right) }));
          // [rightNumber, left]
          sb.emitHelper(node, options, sb.helpers.createNumber);
          this.equalsEqualsRightNumberLeftBooleanOrString(sb, node, options);
        },
      },
    ];

    sb.emitHelper(
      node,
      options,
      sb.helpers.case(cases, () => {
        // [rightPrim, left]
        sb.emitHelper(node, options, sb.helpers.toPrimitive({ type: sb.getType(this.right) }));
        // [left, rightPrim]
        sb.emitOp(node, 'SWAP');
        // [leftPrim, rightPrim]
        sb.emitHelper(node, options, sb.helpers.toPrimitive({ type: sb.getType(this.left) }));
        // [rightPrim, leftPrim]
        sb.emitOp(node, 'SWAP');
        sb.emitHelper(
          node,
          options,
          sb.helpers.case(cases, () => {
            // [leftPrim]
            sb.emitOp(node, 'DROP');
            // []
            sb.emitOp(node, 'DROP');
            // [equals]
            sb.emitPushBoolean(node, false);
          }),
        );
      }),
    );
  }
}
