import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, arr]
// Output: [arr]
export class ArrMapFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [callable, arr]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [arr, callable]
    sb.emitOp(node, 'SWAP');
    // [size, ...arr, callable]
    sb.emitOp(node, 'UNPACK');
    // [size, size, ...arr, callable]
    sb.emitOp(node, 'DUP');
    // [size + 1, size, ...arr, callable]
    sb.emitOp(node, 'INC');
    // [callable, size, ...arr]
    sb.emitOp(node, 'ROLL');
    // [size, callable, ...arr]
    sb.emitOp(node, 'SWAP');
    // [idx, size, callable, ...arr]
    sb.emitPushInt(node, 0);
    // [size, idx, callable, ...arr]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, size, callable, ...arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, callable, ...arr]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, callable, ...arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [callable, idx, size, ...arr]
          sb.emitOp(node, 'ROT');
          // [callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'TUCK');
          // [idx, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'OVER');
          // [idx, idx, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'DUP');
          // [idxVal, idx, callable, idx, callable, size, ...arr]
          sb.emitHelper(node, options, sb.helpers.wrapNumber);
          // [idx, idxVal, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'SWAP');
          // [5, idx, idxVal, callable, idx, callable, size, ...arr]
          sb.emitPushInt(node, 5);
          // [idx + 5, idxVal, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'ADD');
          // [val, idxVal, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'ROLL');
          // [2, val, idxVal, callable, idx, callable, size, ...arr]
          sb.emitPushInt(node, 2);
          // [argsarr, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'PACK');
          // [callable, argsarr, idx, callable, size, ...arr]
          sb.emitOp(node, 'SWAP');
          // [val, idx, callable, size, ...arr]
          sb.emitHelper(node, innerOptions, sb.helpers.call);
          // [idx, val, idx, callable, size, ...arr]
          sb.emitOp(node, 'OVER');
          // [4, idx, val, idx, callable, size, ...arr]
          sb.emitPushInt(node, 4);
          // [idx + 4, val, idx, callable, size, ...arr]
          sb.emitOp(node, 'ADD');
          // [val, idx, callable, size, ...arr]
          sb.emitOp(node, 'XTUCK');
          // [idx, callable, size, ...arr]
          sb.emitOp(node, 'DROP');
          // [idx, callable, size, ...arr]
          sb.emitOp(node, 'INC');
          // [size, idx, callable, ...arr]
          sb.emitOp(node, 'ROT');
        },
      }),
    );
    // [size, callable, ...arr]
    sb.emitOp(node, 'NIP');
    // [size, ...arr]
    sb.emitOp(node, 'NIP');
    // [arr]
    sb.emitOp(node, 'PACK');
  }
}
