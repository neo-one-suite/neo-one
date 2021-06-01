import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrReduceWithoutIteratorHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [accum, arr]
// Output: [accum]
export class ArrReduceWithoutIteratorHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrReduceWithoutIteratorHelperOptions) {
    super();
    this.each = options.each;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [arr, accum]
    sb.emitOp(node, 'SWAP');
    // [arr, arr, accum]
    sb.emitOp(node, 'DUP');
    // [size, arr, accum]
    sb.emitOp(node, 'SIZE');
    // [0, size, arr, accum]
    sb.emitPushInt(node, 0);
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr, accum]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr, accum]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, accum]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, arr, accum]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [2, idx, size, arr, accum]
          sb.emitPushInt(node, 2);
          // [arr, idx, size, arr, accum]
          sb.emitOp(node, 'PICK');
          // [idx, arr, idx, size, arr, accum]
          sb.emitOp(node, 'OVER');
          // [val, idx, size, arr, accum]
          sb.emitOp(node, 'PICKITEM');
          // [idx, val, idx, size, arr, accum]
          sb.emitOp(node, 'OVER');
          // [5, idx, val, idx, size, arr, accum]
          sb.emitPushInt(node, 5);
          // [accum, idx, val, idx, size, arr]
          sb.emitOp(node, 'ROLL');
          if (this.withIndex) {
            // [val, accum, idx, idx, size, arr]
            sb.emitOp(node, 'ROT');
            // [accum, val, idx, idx, size, arr]
            sb.emitOp(node, 'SWAP');
          } else {
            // [accum, val, idx, size, arr]
            sb.emitOp(node, 'NIP');
          }
          // [accum, idx, size, arr]
          this.each(options);
          // [arr, size, idx, accum]
          sb.emitOp(node, 'REVERSE4');
          // [idx, size, arr, accum]
          sb.emitOp(node, 'REVERSE3');
        },
        incrementor: () => {
          // [idx, size, arr, accum]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [size, arr, accum]
          sb.emitOp(node, 'DROP');
          // [arr, accum]
          sb.emitOp(node, 'DROP');
          // [accum]
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
