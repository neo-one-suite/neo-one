import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface EqualsEqualsEqualsHelperOptions {
  readonly left: ts.Node;
  readonly right: ts.Node;
}

// Input: []
// Output: [boolean]
export class EqualsEqualsEqualsHelper extends Helper {
  private readonly left: ts.Node;
  private readonly right: ts.Node;

  public constructor(options: EqualsEqualsEqualsHelperOptions) {
    super();
    this.left = options.left;
    this.right = options.right;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.visit(this.left, options);
    sb.visit(this.right, options);
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    if (tsUtils.type_.isSame(sb.getType(this.left), sb.getType(this.right))) {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsSameType);
    } else {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsUnknown);
    }
  }
}
