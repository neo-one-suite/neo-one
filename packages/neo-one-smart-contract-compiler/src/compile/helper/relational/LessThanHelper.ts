import ts from 'typescript';

import { tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface LessThanHelperOptions {
  readonly leftFirst: boolean;
  readonly left: ts.Node;
  readonly right: ts.Node;
}

// Input: []
// Output: [boolean]
export class LessThanHelper extends Helper {
  private readonly leftFirst: boolean;
  private readonly left: ts.Node;
  private readonly right: ts.Node;

  public constructor(options: LessThanHelperOptions) {
    super();
    this.leftFirst = options.leftFirst;
    this.left = options.left;
    this.right = options.right;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      if (this.leftFirst) {
        sb.visit(this.left, options);
        sb.visit(this.right, options);
      } else {
        sb.visit(this.right, options);
        sb.visit(this.left, options);
      }

      return;
    }

    if (this.leftFirst) {
      // [left]
      sb.visit(this.left, options);
      // [leftPrim]
      sb.emitHelper(
        this.left,
        options,
        sb.helpers.toPrimitive({
          type: sb.getType(this.left),
          preferredType: 'number',
        }),
      );
      // [right, leftPrim]
      sb.visit(this.right, options);
      // [rightPrim, leftPrim]
      sb.emitHelper(
        this.right,
        options,
        sb.helpers.toPrimitive({
          type: sb.getType(this.right),
          preferredType: 'number',
        }),
      );
    } else {
      // [right]
      sb.visit(this.right, options);
      // [rightPrim]
      sb.emitHelper(
        this.right,
        options,
        sb.helpers.toPrimitive({
          type: sb.getType(this.right),
          preferredType: 'number',
        }),
      );
      // [left, rightPrim]
      sb.visit(this.left, options);
      // [leftPrim, rightPrim]
      sb.emitHelper(
        this.left,
        options,
        sb.helpers.toPrimitive({
          type: sb.getType(this.left),
          preferredType: 'number',
        }),
      );
      // [rightPrim, leftPrim]
      sb.emitOp(node, 'SWAP');
    }

    const leftType = sb.getType(this.left);
    const rightType = sb.getType(this.right);
    if (
      leftType !== undefined &&
      rightType !== undefined &&
      tsUtils.type_.isOnlyStringish(leftType) &&
      tsUtils.type_.isOnlyStringish(rightType)
    ) {
      sb.reportUnsupported(node);
    } else {
      // [rightNumber, leftPrim]
      sb.emitHelper(this.right, options, sb.helpers.toNumber({ type: sb.getType(this.right) }));
      // [leftPrim, rightNumber]
      sb.emitOp(node, 'SWAP');
      // [leftNumber, rightNumber]
      sb.emitHelper(this.left, options, sb.helpers.toNumber({ type: sb.getType(this.left) }));
      // [rightNumber, leftNumber]
      sb.emitOp(node, 'SWAP');
      // [lt]
      sb.emitOp(node, 'LT');

      if (!options.pushValue) {
        sb.emitOp(node, 'DROP');
      }
    }
  }
}
