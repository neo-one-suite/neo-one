import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [iterator]
// Output: [map]
export class IteratorToMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map, iterator]
    sb.emitOp(node, 'NEWMAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduce({
        // going in: [accum, key, val]
        each: () => {
          // [map, map, key, val]
          sb.emitOp(node, 'DUP');
          // [val, key, map, map]
          sb.emitOp(node, 'REVERSE4');
          // [map]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );
  }
}
