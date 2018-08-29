import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetCommonStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      return;
    }

    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.commonStorage);
    // [map, keyBuffer, map]
    sb.emitOp(node, 'TUCK');
    // [keyBuffer, map, keyBuffer, map]
    sb.emitOp(node, 'OVER');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, keyBuffer, map]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [value]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [map]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [value]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
        },
      }),
    );
  }
}
