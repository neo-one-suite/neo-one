import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { UnwrapHelper } from './UnwrapHelper';

// Input: [val]
// Output: [value]
export abstract class UnwrapCopyStructHelper extends UnwrapHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [1, val]
    sb.emitPushInt(node, 1);
    // [value]
    sb.emitOp(node, 'PICKITEM');
    // [value]
    sb.emitOp(node, 'VALUES');
    // [value, value]
    sb.emitOp(node, 'DUP');
    // [size, value]
    sb.emitOp(node, 'SIZE');
    // [struct, value]
    sb.emitOp(node, 'NEWSTRUCT');
    // [struct]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduceWithoutIterator({
        withIndex: true,
        each: () => {
          // [accum, accum, val, idx]
          sb.emitOp(node, 'DUP');
          // [idx, val, accum, accum]
          sb.emitOp(node, 'REVERSE4');
          // [val, idx, accum, accum]
          sb.emitOp(node, 'SWAP');
          // [accum]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );
  }
}
