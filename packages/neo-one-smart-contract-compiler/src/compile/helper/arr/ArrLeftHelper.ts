import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [start, arr]
// Output: [arr]
export class ArrLeftHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      // [arr]
      sb.emitOp(node, 'DROP');
      // []
      sb.emitOp(node, 'DROP');

      return;
    }

    // [arr, start, arr]
    sb.emitOp(node, 'OVER');
    // [size, start, arr]
    sb.emitOp(node, 'ARRAYSIZE');
    // [0, size, start, arr]
    sb.emitPushInt(node, 0);
    // [outputArr, size, start, arr]
    sb.emitOp(node, 'NEWARRAY');
    // [start, outputArr, size, arr]
    sb.emitOp(node, 'ROT');
    // [size, idx, outputArr, arr]
    sb.emitOp(node, 'ROT');

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, size, outputArr, arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, outputArr, arr]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, outputArr, arr]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [2, idx, size, outputArr, arr]
          sb.emitPushInt(node, 2);
          // [outputArr, idx, size, outputArr, arr]
          sb.emitOp(node, 'PICK');
          // [4, outputArr, idx, size, outputArr, arr]
          sb.emitPushInt(node, 4);
          // [arr, outputArr, idx, size, outputArr, arr]
          sb.emitOp(node, 'PICK');
          // [2, arr, outputArr, idx, size, outputArr, arr]
          sb.emitPushInt(node, 2);
          // [idx, arr, outputArr, idx, size, outputArr, arr]
          sb.emitOp(node, 'PICK');
          // [value, outputArr, idx, size, outputArr, arr]
          sb.emitOp(node, 'PICKITEM');
          // [idx, size, outputArr, arr]
          sb.emitOp(node, 'APPEND');
          // [idx, size, outputArr, arr]
          sb.emitOp(node, 'INC');
          // [size, idx, outputArr, arr]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );

    // [idx, outputArr, arr]
    sb.emitOp(node, 'DROP');
    // [outputArr, arr]
    sb.emitOp(node, 'DROP');
    // [outputArr]
    sb.emitOp(node, 'NIP');
  }
}
