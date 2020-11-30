import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, accum, arr]
// Output: []
export class ArrReduceFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, accum, arr]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [arr, callable, accum]
    sb.emitOp(node, 'ROT');
    // [arr, arr, callable, accum]
    sb.emitOp(node, 'DUP');
    // [size, arr, callable, accum]
    sb.emitOp(node, 'SIZE');
    // [idx, size, arr, callable, accum]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr, callable, accum]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr, callable, accum]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, callable, accum]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, arr, callable, accum]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [idx, idx, size, arr, callable, accum]
          sb.emitOp(node, 'DUP');
          // [3, idx, idx, size, arr, callable, accum]
          sb.emitPushInt(node, 3);
          // [arr, idx, idx, size, arr, callable, accum]
          sb.emitOp(node, 'PICK');
          // [idx, arr, idx, idx, size, arr, callable, accum]
          sb.emitOp(node, 'OVER');
          // [val, idx, idx, size, arr, callable, accum]
          sb.emitOp(node, 'PICKITEM');
          // [idx, val, idx, size, arr, callable, accum]
          sb.emitOp(node, 'SWAP');
          // [idxVal, val, idx, size, arr, callable, accum]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          // [val, idxVal, idx, size, arr, callable, accum]
          sb.emitOp(node, 'SWAP');
          // [6, val, idxVal, idx, size, arr, callable, accum]
          sb.emitPushInt(node, 6);
          // [accum, val, idxVal, idx, size, arr, callable]
          sb.emitOp(node, 'ROLL');
          // [3, accum, val, idx, idx, size, arr, callable]
          sb.emitPushInt(node, 3);
          // [argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PACK');
          // [4, argsarr, idx, size, arr, callable]
          sb.emitPushInt(node, 4);
          // [callable, argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [accum, idx, size, arr, callable]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.call);
          // [5, accum, idx, size, arr, callable]
          sb.emitPushInt(node, 5);
          // [accum, idx, size, arr, callable, accum]
          sb.emitOp(node, 'XTUCK');
          // [idx, size, arr, callable, accum]
          sb.emitOp(node, 'DROP');
        },
        incrementor: () => {
          // [idx, size, arr, callable, accum]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [size, arr, callable, accum]
          sb.emitOp(node, 'DROP');
          // [arr, callable, accum]
          sb.emitOp(node, 'DROP');
          // [callable, accum]
          sb.emitOp(node, 'DROP');
          // [accum]
          sb.emitOp(node, 'DROP');

          if (!optionsIn.pushValue) {
            // []
            sb.emitOp(node, 'DROP');
          }
        },
      }),
    );
  }
}
