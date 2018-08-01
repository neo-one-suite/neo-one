import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrSliceHelperOptions {
  readonly hasEnd?: boolean;
}

// Input: [start, end?, arr]
// Output: [arr]
export class ArrSliceHelper extends Helper {
  private readonly hasEnd: boolean;

  public constructor(options: ArrSliceHelperOptions) {
    super();
    this.hasEnd = options.hasEnd === undefined ? false : options.hasEnd;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      // [end?, arr]
      sb.emitOp(node, 'DROP');
      if (this.hasEnd) {
        // [arr]
        sb.emitOp(node, 'DROP');
      }
      // []
      sb.emitOp(node, 'DROP');

      return;
    }

    if (!this.hasEnd) {
      // [arr, start, arr]
      sb.emitOp(node, 'OVER');
      // [end, start, arr]
      sb.emitOp(node, 'ARRAYSIZE');
      // [start, end, arr]
      sb.emitOp(node, 'SWAP');
    }

    // [end, start, arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [start, end, start, arr]
          sb.emitOp(node, 'TUCK');
          // [0, start, end, start, arr]
          sb.emitPushInt(node, 0);
          // [start < 0, start, end, arr]
          sb.emitOp(node, 'LT');
        },
        whenTrue: () => {
          // [arr, start, end]
          sb.emitOp(node, 'ROT');
          // [arr, start, arr, end]
          sb.emitOp(node, 'TUCK');
          // [size, start, arr, end]
          sb.emitOp(node, 'ARRAYSIZE');
          // [start, arr, end]
          sb.emitOp(node, 'ADD');
          // [end, start, arr]
          sb.emitOp(node, 'ROT');
        },
      }),
    );

    // [end, start, arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [end, end, start, arr]
          sb.emitOp(node, 'DUP');
          // [0, end, end, start, arr]
          sb.emitPushInt(node, 0);
          // [end < 0, end, start, arr]
          sb.emitOp(node, 'LT');
        },
        whenTrue: () => {
          // [arr, end, start]
          sb.emitOp(node, 'ROT');
          // [arr, end, arr, start]
          sb.emitOp(node, 'TUCK');
          // [size, end, arr, start]
          sb.emitOp(node, 'ARRAYSIZE');
          // [end, arr, start]
          sb.emitOp(node, 'ADD');
          // [start, end, arr]
          sb.emitOp(node, 'ROT');
          // [end, start, arr]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );

    // [arr, end, start]
    sb.emitOp(node, 'ROT');
    // [arr, end, arr, start]
    sb.emitOp(node, 'TUCK');
    // [size, end, arr, start]
    sb.emitOp(node, 'ARRAYSIZE');
    // [end, arr, start]
    sb.emitOp(node, 'MIN');
    // [start, end, arr]
    sb.emitOp(node, 'ROT');
    // [0, start, end, arr]
    sb.emitPushInt(node, 0);
    // [start, end, arr]
    sb.emitOp(node, 'MAX');

    // [end, idx, arr]
    sb.emitOp(node, 'SWAP');
    // [0, end, idx, arr]
    sb.emitPushInt(node, 0);
    // [outputArr, end, idx, arr]
    sb.emitOp(node, 'NEWARRAY');
    // [idx, outputArr, end, arr]
    sb.emitOp(node, 'ROT');
    // [end, idx, outputArr, arr]
    sb.emitOp(node, 'ROT');

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [idx, end, outputArr, arr]
          sb.emitOp(node, 'SWAP');
          // [idx, end, idx, outputArr, arr]
          sb.emitOp(node, 'TUCK');
          // [end, idx, end, idx, outputArr, arr]
          sb.emitOp(node, 'OVER');
          // [idx < end, end, idx, outputArr, arr]
          sb.emitOp(node, 'LT');
        },
        each: () => {
          // [idx, end, outputArr, arr]
          sb.emitOp(node, 'SWAP');
          // [outputArr, idx, end, arr]
          sb.emitOp(node, 'ROT');
          // [outputArr, idx, outputArr, end, arr]
          sb.emitOp(node, 'TUCK');
          // [idx, outputArr, idx, outputArr, end, arr]
          sb.emitOp(node, 'OVER');
          // [5, idx, outputArr, idx, outputArr, end, arr]
          sb.emitPushInt(node, 5);
          // [arr, idx, outputArr, idx, outputArr, end, arr]
          sb.emitOp(node, 'PICK');
          // [idx, arr, outputArr, idx, outputArr, end, arr]
          sb.emitOp(node, 'SWAP');
          // [value, outputArr, idx, outputArr, end, arr]
          sb.emitOp(node, 'PICKITEM');
          // [idx, outputArr, end, arr]
          sb.emitOp(node, 'APPEND');
          // [idx, outputArr, end, arr]
          sb.emitOp(node, 'INC');
          // [end, idx, outputArr, arr]
          sb.emitOp(node, 'ROT');
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
