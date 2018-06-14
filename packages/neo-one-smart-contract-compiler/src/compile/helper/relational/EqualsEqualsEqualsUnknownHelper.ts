import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val0, val1]
// Output: [boolean]
export class EqualsEqualsEqualsUnknownHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
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
          // [val1, val0, val1]
          sb.emitOp(node, 'TUCK');
          // [val0, val1, val0, val1]
          sb.emitOp(node, 'OVER');
          sb.emitHelper(node, options, sb.helpers.isSameType);
        },
        whenTrue: () => {
          // [boolean]
          sb.emitHelper(node, options, sb.helpers.equalsEqualsEqualsSameType);
        },
        whenFalse: () => {
          // [val1]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
      }),
    );
  }
}
