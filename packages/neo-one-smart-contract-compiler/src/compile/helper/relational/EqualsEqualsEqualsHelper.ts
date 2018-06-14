import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

import * as typeUtils from '../../../typeUtils';

export interface EqualsEqualsEqualsHelperOptions {
  readonly left: Node;
  readonly right: Node;
}

// Input: []
// Output: [boolean]
export class EqualsEqualsEqualsHelper extends Helper {
  private readonly left: Node;
  private readonly right: Node;

  public constructor(options: EqualsEqualsEqualsHelperOptions) {
    super();
    this.left = options.left;
    this.right = options.right;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    sb.visit(this.left, options);
    sb.visit(this.right, options);
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    if (typeUtils.isSame(sb.getType(this.left), sb.getType(this.right))) {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsSameType);
    } else {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsUnknown);
    }
  }
}
