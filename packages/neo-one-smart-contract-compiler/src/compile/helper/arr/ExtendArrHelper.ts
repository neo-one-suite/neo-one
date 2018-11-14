import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [length, arr]
// Output: []
export class ExtendArrHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [arr, length, arr]
    sb.emitOp(node, 'OVER');
    // [currentLength, length, arr]
    sb.emitOp(node, 'ARRAYSIZE');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [currentLength, length, currentLength, arr]
          sb.emitOp(node, 'TUCK');
          // [length, currentLength, length, currentLength, arr]
          sb.emitOp(node, 'OVER');
          // [expectedLengthGTCurrentLength, length, currentLength, arr]
          sb.emitOp(node, 'LT');
        },
        each: () => {
          // [arr, length, currentLength]
          sb.emitOp(node, 'ROT');
          // [arr, arr, length, currentLength]
          sb.emitOp(node, 'DUP');
          // [undefinedVal, arr, arr, length, currentLength]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          // [arr, length, currentLength]
          sb.emitOp(node, 'APPEND');
        },
        incrementor: () => {
          // [currentLength, arr, length]
          sb.emitOp(node, 'ROT');
          // [currentLength, arr, length]
          sb.emitOp(node, 'INC');
          // [length, currentLength, arr]
          sb.emitOp(node, 'ROT');
          // [currentLength, length, arr]
          sb.emitOp(node, 'SWAP');
        },
        cleanup: () => {
          // do nothing
        },
      }),
    );
    // [length, arr]
    sb.emitOp(node, 'DROP');
    // [arr]
    sb.emitOp(node, 'DROP');
    // []
    sb.emitOp(node, 'DROP');
  }
}
