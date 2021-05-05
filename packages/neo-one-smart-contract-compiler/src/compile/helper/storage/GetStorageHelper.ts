import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [keyBuffer]
    sb.emitHelper(node, options, sb.helpers.sliceKey);
    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.deleteCacheStorage);
    // [keyBuffer, map, keyBuffer]
    sb.emitOp(node, 'OVER');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [keyBuffer]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [value]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
        },
        whenFalse: () => {
          // [map, keyBuffer]
          sb.emitHelper(node, options, sb.helpers.cacheStorage);
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
                // [keyBuffer]
                sb.emitOp(node, 'NIP');
                // [value]
                sb.emitHelper(node, options, sb.helpers.getStorageBase);
              },
            }),
          );
        },
      }),
    );
  }
}
