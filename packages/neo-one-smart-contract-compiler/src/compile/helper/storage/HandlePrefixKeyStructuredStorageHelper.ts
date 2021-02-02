import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [size, keyVal]
// Output: [val]
export class HandlePrefixKeyStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [keyVal, size]
    sb.emitOp(node, 'SWAP');
    // [arr, size]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [size, arr]
    sb.emitOp(node, 'SWAP');
    // [arr]
    sb.emitHelper(node, options, sb.helpers.arrLeft);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [arr, arr]
          sb.emitOp(node, 'DUP');
          // [size, arr]
          sb.emitOp(node, 'SIZE');
          // [1, size, arr]
          sb.emitPushInt(node, 1);
          // [boolean, arr]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [number, arr]
          sb.emitPushInt(node, 0);
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapArray);
        },
      }),
    );
  }
}
