import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [right, left]
// Output: [arr]
export class ArrConcatHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [accum, right]
    sb.emitOp(node, 'SWAP');
    // [arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduceWithoutIterator({
        each: () => {
          // [accum, accum, val]
          sb.emitOp(node, 'DUP');
          // [val, accum, accum]
          sb.emitOp(node, 'ROT');
          // [accum]
          sb.emitOp(node, 'APPEND');
        },
      }),
    );
  }
}
