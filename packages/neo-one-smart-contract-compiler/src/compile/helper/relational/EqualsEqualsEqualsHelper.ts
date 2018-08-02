import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface EqualsEqualsEqualsHelperOptions {
  readonly leftType: ts.Type | undefined;
  readonly rightType: ts.Type | undefined;
}

// Input: [rightVal, leftVal]
// Output: [boolean]
export class EqualsEqualsEqualsHelper extends Helper {
  private readonly leftType: ts.Type | undefined;
  private readonly rightType: ts.Type | undefined;

  public constructor(options: EqualsEqualsEqualsHelperOptions) {
    super();
    this.leftType = options.leftType;
    this.rightType = options.rightType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    if (tsUtils.type_.isSame(this.leftType, this.rightType)) {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsSameType);
    } else {
      sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsUnknown);
    }
  }
}
