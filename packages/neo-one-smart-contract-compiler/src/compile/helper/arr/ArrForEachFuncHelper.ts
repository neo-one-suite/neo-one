import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, arr]
// Output: []
export class ArrForEachFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, arr]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [arr, callable]
    sb.emitOp(node, 'SWAP');
    // [arr, arr, callable]
    sb.emitOp(node, 'DUP');
    // [size, arr, callable]
    sb.emitOp(node, 'ARRAYSIZE');
    // [idx, size, arr, callable]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr, callable]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr, callable]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, callable]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, arr, callable]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [idx, idx, size, arr, callable]
          sb.emitOp(node, 'DUP');
          // [idxVal, idx, size, arr, callable]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          // [3, idxVal, idx, size, arr, callable]
          sb.emitPushInt(node, 3);
          // [arr, idxVal, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [2, arr, idxVal, idx, size, arr, callable]
          sb.emitPushInt(node, 2);
          // [idx, arr, idxVal, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [val, idxVal, idx, size, arr, callable]
          sb.emitOp(node, 'PICKITEM');
          // [2, val, idxVal, idx, size, arr, callable]
          sb.emitPushInt(node, 2);
          // [argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PACK');
          // [4, argsarr, idx, size, arr, callable]
          sb.emitPushInt(node, 4);
          // [callable, argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [idx, size, arr, callable]
          sb.emitHelper(node, sb.noPushValueOptions(innerOptions), sb.helpers.call);
        },
        incrementor: () => {
          // [idx, size, arr, callable]
          sb.emitOp(node, 'INC');
        },
      }),
    );
    // [size, arr, callable]
    sb.emitOp(node, 'DROP');
    // [arr, callable]
    sb.emitOp(node, 'DROP');
    // [callable]
    sb.emitOp(node, 'DROP');
    // []
    sb.emitOp(node, 'DROP');

    if (optionsIn.pushValue) {
      sb.emitHelper(node, options, sb.helpers.wrapUndefined);
    }
  }
}
