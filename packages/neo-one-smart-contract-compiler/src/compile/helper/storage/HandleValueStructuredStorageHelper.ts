import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [size, iterator]
// Output: [boolean, keyVal, valVal]
export class HandleValueStructuredStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [iterator, size]
    sb.emitOp(node, 'SWAP');
    // [iterator, iterator, size]
    sb.emitOp(node, 'DUP');
    // [keyBuffer, iterator, size]
    sb.emitSysCall(node, 'Neo.Iterator.Key');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [map, keyBuffer, iterator, size]
          sb.emitHelper(node, options, sb.helpers.deleteCacheStorage);
          // [keyBuffer, map, iterator, size]
          sb.emitOp(node, 'SWAP');
          // [boolean, iterator, size]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [boolean, iterator, size]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          // [value, size]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [arr, size]
          sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          // [2, keyVal, valVal, size]
          sb.emitOp(node, 'UNPACK');
          // [keyVal, valVal, size]
          sb.emitOp(node, 'DROP');
          // [size, keyVal, valVal]
          sb.emitOp(node, 'ROT');
          // [keyVal, valVal]
          sb.emitHelper(node, options, sb.helpers.handlePrefixKeyStructuredStorage);
          // [boolean, keyVal, valVal]
          sb.emitPushBoolean(node, true);
        },
      }),
    );
  }
}
