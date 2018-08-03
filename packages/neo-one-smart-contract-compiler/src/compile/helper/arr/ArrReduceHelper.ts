import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [accum, arr]
// Output: [accum]
export class ArrReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrReduceHelperOptions) {
    super();
    this.each = options.each;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [arr, accum]
    sb.emitOp(node, 'SWAP');
    // [size, ...arr, accum]
    sb.emitOp(node, 'UNPACK');
    // [size, size, ...arr, accum]
    sb.emitOp(node, 'DUP');
    // [number, size, ...arr, accum]
    sb.emitOp(node, 'INC');
    // [accum, size, ...arr]
    sb.emitOp(node, 'ROLL');
    // [size, accum, ...arr]
    sb.emitOp(node, 'SWAP');
    // [idx, size, accum, ...arr]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, accum, ...arr]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, accum, ...arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, accum, ...arr]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, accum, ...arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [accum, idx, size, ...arr]
          sb.emitOp(node, 'ROT');
          if (this.withIndex) {
            // [idx, accum, idx, size, ...arr]
            sb.emitOp(node, 'OVER');
            // [4, idx, accum, idx, size, ...arr]
            sb.emitPushInt(node, 4);
            // [value, idx, accum, idx, size, ...arr]
            sb.emitOp(node, 'ROLL');
            // [accum, value, idx, idx, size, ...arr]
            sb.emitOp(node, 'ROT');
          } else {
            // [3, accum, idx, size, ...arr]
            sb.emitPushInt(node, 3);
            // [value, accum, idx, size, ...arr]
            sb.emitOp(node, 'ROLL');
            // [accum, value, idx, size, ...arr]
            sb.emitOp(node, 'SWAP');
          }

          // [accum, idx, size, ...arr]
          this.each(innerOptions);
          // [size, accum, idx, ...arr]
          sb.emitOp(node, 'ROT');
          // [idx, size, accum, ...arr]
          sb.emitOp(node, 'ROT');
        },
        incrementor: () => {
          // [idx, size, accum, ...arr]
          sb.emitOp(node, 'INC');
        },
      }),
    );
    // [size, accum]
    sb.emitOp(node, 'DROP');
    // [accum]
    sb.emitOp(node, 'DROP');
  }
}
