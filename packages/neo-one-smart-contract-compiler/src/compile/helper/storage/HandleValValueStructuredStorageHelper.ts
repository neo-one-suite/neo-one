import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [iterator]
// Output: [boolean, val]
export class HandleValValueStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [iterator, iterator]
    sb.emitOp(node, 'DUP');
    // [keyBuffer, iterator, size]
    sb.emitHelper(node, options, sb.helpers.getMapIteratorKey);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [map, keyBuffer, iterator]
          sb.emitHelper(node, options, sb.helpers.deleteCacheStorage);
          // [keyBuffer, map, iterator]
          sb.emitOp(node, 'SWAP');
          // [iterator]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [boolean, iterator]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          // [value]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [arr]
          sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
          // [1, arr]
          sb.emitPushInt(node, 1);
          // [val]
          sb.emitOp(node, 'PICKITEM');
          // [boolean, val]
          sb.emitPushBoolean(node, true);
        },
      }),
    );
  }
}
