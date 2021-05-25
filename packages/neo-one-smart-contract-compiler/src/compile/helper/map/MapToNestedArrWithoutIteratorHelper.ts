import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [map]
// Output: [...[key, val]]
export class MapToNestedArrWithoutIteratorHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [accum, map]
    sb.emitOp(node, 'NEWARRAY0');
    sb.emitHelper(
      node,
      options,
      sb.helpers.mapReduceWithoutIterator({
        each: () => {
          // [val, arr, key]
          sb.emitOp(node, 'ROT');
          // [key, val, arr]
          sb.emitOp(node, 'ROT');
          // [num, key, val, arr]
          sb.emitPushInt(node, 2);
          // [struct, key, val, arr]
          sb.emitOp(node, 'NEWSTRUCT');
          // [struct, key, struct, val, arr]
          sb.emitOp(node, 'TUCK');
          // [0, struct, key, struct, val, arr]
          sb.emitPushInt(node, 0);
          // [key, 0, struct, struct, val, arr]
          sb.emitOp(node, 'ROT');
          // [struct, val, arr]
          sb.emitOp(node, 'SETITEM');
          // [struct, val, struct, arr]
          sb.emitOp(node, 'TUCK');
          // [1, struct, val, struct, arr]
          sb.emitPushInt(node, 1);
          // [val, 1, struct, struct, arr]
          sb.emitOp(node, 'ROT');
          // [struct, arr]
          sb.emitOp(node, 'SETITEM');
          // [arr, struct]
          sb.emitOp(node, 'SWAP');
          // [arr, arr, struct]
          sb.emitOp(node, 'DUP');
          // [struct, arr, arr]
          sb.emitOp(node, 'ROT');
          // [arr]
          sb.emitOp(node, 'APPEND');
        },
      }),
    );
  }
}
