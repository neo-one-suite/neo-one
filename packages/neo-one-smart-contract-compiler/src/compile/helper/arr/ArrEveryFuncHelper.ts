import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, arr]
// Output: [boolean]
export class ArrEveryFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, arr]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [arr, callable]
    sb.emitOp(node, 'SWAP');
    // [idx, arr, callable]
    sb.emitPushInt(node, 0);
    // [result, idx, arr, callable]
    sb.emitPushBoolean(node, true);
    // [arr, result, idx, callable]
    sb.emitOp(node, 'ROT');
    // [arr, arr, result, idx, callable]
    sb.emitOp(node, 'DUP');
    // [size, arr, result, idx, callable]
    sb.emitOp(node, 'SIZE');
    // [result, size, arr, idx, callable]
    sb.emitOp(node, 'ROT');
    // [arr, result, size, idx, callable]
    sb.emitOp(node, 'ROT');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [idx, size, result, arr, callable]
          sb.emitOp(node, 'REVERSE4');
          // [size, idx, size, result, arr, callable]
          sb.emitOp(node, 'OVER');
          // [idx, size, idx, size, result, arr, callable]
          sb.emitOp(node, 'OVER');
          // [boolean, idx, size, result, arr, callable]
          sb.emitOp(node, 'GT');
          // [size, idx, boolean, result, arr, callable]
          sb.emitOp(node, 'REVERSE3');
          // [result, boolean, idx, size, arr, callable]
          sb.emitOp(node, 'REVERSE4');
          // [result, boolean, result, idx, size, arr, callable]
          sb.emitOp(node, 'TUCK');
          // [boolean, result, idx, size, arr, callable]
          sb.emitOp(node, 'BOOLAND');
        },
        each: (innerOptions) => {
          // [idx, size, arr, callable]
          sb.emitOp(node, 'DROP');
          // [2, idx, size, arr, callable]
          sb.emitPushInt(node, 2);
          // [arr, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [idx, arr, idx, size, arr, callable]
          sb.emitOp(node, 'OVER');
          // [val, idx, size, arr, callable]
          sb.emitOp(node, 'PICKITEM');
          // [idx, val, idx, size, arr, callable]
          sb.emitOp(node, 'OVER');
          // [idxVal, val, idx, size, arr, callable]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          // [val, idxVal, idx, size, arr, callable]
          sb.emitOp(node, 'SWAP');
          // [2, val, idxVal, idx, size, arr, callable]
          sb.emitPushInt(node, 2);
          // [argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PACK');
          // [4, argsarr, idx, size, arr, callable]
          sb.emitPushInt(node, 4);
          // [callable, argsarr, idx, size, arr, callable]
          sb.emitOp(node, 'PICK');
          // [val, idx, size, arr, callable]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.call);
          // [result, idx, size, arr, callable]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.unwrapBoolean);
          // [size, result, idx, arr, callable]
          sb.emitOp(node, 'ROT');
          // [idx, size, result, arr, callable]
          sb.emitOp(node, 'ROT');
          // [idx, size, result, arr, callable]
          sb.emitOp(node, 'INC');
          // [arr, result, size, idx, callable]
          sb.emitOp(node, 'REVERSE4');
        },
        cleanup: () => {
          // [result, size, arr, callable]
          sb.emitOp(node, 'NIP');
          // [result, arr, callable]
          sb.emitOp(node, 'NIP');
          // [result, callable]
          sb.emitOp(node, 'NIP');
          // [result]
          sb.emitOp(node, 'NIP');
        },
      }),
    );
  }
}
