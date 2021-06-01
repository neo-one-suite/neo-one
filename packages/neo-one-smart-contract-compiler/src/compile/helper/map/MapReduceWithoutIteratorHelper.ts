import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapReduceWithoutIteratorHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, map]
// Output: [accum]
export class MapReduceWithoutIteratorHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapReduceWithoutIteratorHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map, accum]
    sb.emitOp(node, 'SWAP');
    // [map, map, accum]
    sb.emitOp(node, 'DUP');
    // [keysArr, map, accum]
    sb.emitOp(node, 'KEYS');
    // [keysArr, keysArr, map, accum]
    sb.emitOp(node, 'DUP');
    // [size, keysArr, map, accum]
    sb.emitOp(node, 'SIZE');
    // [idx, size, keysArr, map, accum]
    sb.emitPushInt(node, 0);
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, keysArr, map, accum]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [2, idx, size, keysArr, map, accum]
          sb.emitPushInt(node, 2);
          // [keysArr, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'PICK');
          // [idx, keysArr, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'OVER');
          // [key, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'PICKITEM');
          // [4, key, idx, size, keysArr, map, accum]
          sb.emitPushInt(node, 4);
          // [map, key, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'PICK');
          // [key, map, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'SWAP');
          // [key, map, key, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'TUCK');
          // [value, key, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'PICKITEM');
          // [key, value, idx, size, keysArr, map, accum]
          sb.emitOp(node, 'SWAP');
          // [6, key, value, idx, size, keysArr, map, accum]
          sb.emitPushInt(node, 6);
          // [accum, key, value, idx, size, keysArr, map]
          sb.emitOp(node, 'ROLL');
          // [accum, idx, size, keysArr, map]
          this.each(options);
          // [5, accum, idx, size, keysArr, map]
          sb.emitPushInt(node, 5);
          // [map, keysArr, size, idx, accum]
          sb.emitOp(node, 'REVERSEN');
          // [idx, size, keysArr, map, accum]
          sb.emitOp(node, 'REVERSE4');
        },
        incrementor: () => {
          // [idx, size, keysArr, map, accum]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [size, keysArr, map, accum]
          sb.emitOp(node, 'DROP');
          // [keysArr, map, accum]
          sb.emitOp(node, 'DROP');
          // [map, accum]
          sb.emitOp(node, 'DROP');
          // [accum]
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
