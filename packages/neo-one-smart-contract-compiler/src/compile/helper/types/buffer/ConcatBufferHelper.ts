import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [arr]
// Output: [buffer]
export class ConcatBufferHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [buffer, arr]
    sb.emitPushBuffer(node, Buffer.from([]));
    // [buffer]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduceWithoutIterator({
        withIndex: false,
        each: (innerOptions) => {
          // [bufferVal, accum]
          sb.emitOp(node, 'SWAP');
          // [buffer, accum]
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapBuffer);
          // [buffer]
          sb.emitOp(node, 'CAT');
        },
      }),
    );
  }
}
