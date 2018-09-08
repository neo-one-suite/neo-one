import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [indexNumber, bufferVal]
// Output: [val]
export class GetBufferIndexHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [bufferVal, indexNumber]
    sb.emitOp(node, 'SWAP');
    // [buffer, indexNumber]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [buffer, indexNumber, buffer]
    sb.emitOp(node, 'TUCK');
    // [size, indexNumber, buffer]
    sb.emitOp(node, 'SIZE');
    // [indexNumber, size, indexNumber, buffer]
    sb.emitOp(node, 'OVER');

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size > indexNumber, indexNumber, buffer]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [buffer, indexNumber, buffer]
          sb.emitOp(node, 'OVER');
          // [size, indexNumber, buffer]
          sb.emitOp(node, 'SIZE');
          // [indexNumber, size, buffer]
          sb.emitOp(node, 'SWAP');
          // [size - indexNumber, buffer]
          sb.emitOp(node, 'SUB');
          // [buffer]
          sb.emitOp(node, 'RIGHT');
          // [1, buffer]
          sb.emitPushInt(node, 1);
          // [buffer]
          sb.emitOp(node, 'LEFT');
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
        },
        whenFalse: () => {
          // [indexNumber]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
      }),
    );
  }
}
