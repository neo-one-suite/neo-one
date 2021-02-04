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
    sb.emitOp(node, 'DUP');
    // [idx, size, callable, ...arr]
    sb.emitOp(node, 'DEC');
    // [size, idx, callable, ...arr]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [idx, size, callable, ...arr]
          sb.emitOp(node, 'SWAP');
          // [idx, idx, size, callable, ...arr]
          sb.emitOp(node, 'DUP');
          // [0, idx, idx, size, callable, ...arr]
          sb.emitPushInt(node, 0);
          // [idx >= 0, idx, size, callable, ...arr]
          sb.emitOp(node, 'GE');
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
          // [idxVal, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'DROP');
          // [4, idxVal, callable, idx, callable, size, ...arr]
          sb.emitPushInt(node, 4);
          // [size, idxVal, callable, idx, callable, size, ...arr]
          sb.emitOp(node, 'PICK');
          // [4, size, idxVal, callable, idx, callable, size, ...arr]
          sb.emitPushInt(node, 4);
          // [size + 4, idxVal, callable, idx, callable, size, ...arr]
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
          // [size, callable, idx, ...arr]
          sb.emitOp(node, 'REVERSE4');
          // [idx, callable, size, ...arr]
          sb.emitOp(node, 'REVERSE3');
          // [idx, callable, size, ...arr]
          sb.emitOp(node, 'DEC');
          // [size, idx, callable, ...arr]
          sb.emitOp(node, 'ROT');
        },
        cleanup: () => {
          // [size, callable, ...arr]
          sb.emitOp(node, 'DROP');
          // [size, ...arr]
          sb.emitOp(node, 'NIP');
          // [arr]
          sb.emitOp(node, 'PACK');
        },
      }),
    );
  }
}
