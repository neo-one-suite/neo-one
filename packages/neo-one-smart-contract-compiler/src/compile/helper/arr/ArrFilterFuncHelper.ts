import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal, arr]
// Output: [arr]
export class ArrFilterFuncHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

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
    // [0, size, callable, ...arr]
    sb.emitPushInt(node, 0);
    // [arr, size, callable, ...arr]
    sb.emitOp(node, 'NEWARRAY');
    // [size, arr, callable, ...arr]
    sb.emitOp(node, 'SWAP');
    // [idx, size, arr, callable, ...arr]
    sb.emitPushInt(node, 0);
    // [size, idx, arr, callable, ...arr]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, size, arr, callable, ...arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, callable, ...arr]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, arr, callable, ...arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'ROT');
          // [idx, arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'OVER');
          // [idxVal, arr, idx, size, callable, ...arr]
          sb.emitHelper(node, innerOptions, sb.helpers.createNumber);
          // [5, idxVal, arr, idx, size, callable, ...arr]
          sb.emitPushInt(node, 5);
          // [value, idxVal, arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'ROLL');
          // [value, idxVal, value, arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'TUCK');
          // [2, value, idxVal, value, arr, idx, size, callable, ...arr]
          sb.emitPushInt(node, 2);
          // [argsarr, value, arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'PACK');
          // [5, argsarr, value, arr, idx, size, callable, ...arr]
          sb.emitPushInt(node, 5);
          // [callable, argsarr, value, arr, idx, size, callable, ...arr]
          sb.emitOp(node, 'PICK');

          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [keepVal, value, arr, idx, size, callable, ...arr]
                // tslint:disable-next-line no-map-without-usage
                sb.emitHelper(node, innerOptions, sb.helpers.call);
                // [keep, value, arr, idx, size, callable, ...arr]
                sb.emitHelper(node, innerOptions, sb.helpers.toBoolean({ type: undefined }));
              },
              whenTrue: () => {
                // [arr, value, arr, idx, size, callable, ...arr]
                sb.emitOp(node, 'OVER');
                // [value, arr, arr, idx, size, callable, ...arr]
                sb.emitOp(node, 'SWAP');
                // [arr, idx, size, callable, ...arr]
                sb.emitOp(node, 'APPEND');
              },
              whenFalse: () => {
                // [arr, idx, size, callable, ...arr]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
          // [idx, arr, size, callable, ...arr]
          sb.emitOp(node, 'SWAP');
          // [idx, arr, size, callable, ...arr]
          sb.emitOp(node, 'INC');
          // [size, idx, arr, callable, ...arr]
          sb.emitOp(node, 'ROT');
        },
      }),
    );
    // [idx, arr, callable]
    sb.emitOp(node, 'DROP');
    // [arr, callable]
    sb.emitOp(node, 'DROP');
    // [arr]
    sb.emitOp(node, 'NIP');

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
