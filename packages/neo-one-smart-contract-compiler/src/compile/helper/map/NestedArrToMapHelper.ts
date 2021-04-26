import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [...[key, val]]
// Output: [map]
export class NestedArrToMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map, nestedArr]
    sb.emitOp(node, 'NEWMAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduce({
        each: () => {
          // [map, [key, val], map]
          sb.emitOp(node, 'TUCK');
          // [[key, val], map, map]
          sb.emitOp(node, 'SWAP');
          // [size, key, val, map, map]
          sb.emitOp(node, 'UNPACK');
          // [key, val, map, map]
          sb.emitOp(node, 'DROP');
          // [val, key, map, map]
          sb.emitOp(node, 'SWAP');
          // [map]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );
  }
}
