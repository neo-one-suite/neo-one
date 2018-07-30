import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val0, val1]
// Output: [boolean]
export class EqualsEqualsEqualsSameTypeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [val0, val0, val1]
          sb.emitOp(node, 'DUP');
          // [isNullOrUndefined]
          sb.emitHelper(node, options, sb.helpers.isNullOrUndefined);
        },
        whenTrue: () => {
          // [val1]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, true);
        },
        whenFalse: () => {
          // [value0, val1]
          sb.emitHelper(node, options, sb.helpers.unwrapVal);
          // [val1, value0]
          sb.emitOp(node, 'SWAP');
          // [value1, value0]
          sb.emitHelper(node, options, sb.helpers.unwrapVal);
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
      }),
    );
  }
}
