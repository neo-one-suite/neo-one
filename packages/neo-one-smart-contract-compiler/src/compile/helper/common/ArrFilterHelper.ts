import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export interface ArrFilterHelperOptions {
  map: () => void;
  withIndex?: boolean;
}

// Input: [array]
// Output: [array]
export class ArrFilterHelper extends Helper {
  private readonly map: () => void;
  private readonly withIndex: boolean;

  constructor(options: ArrFilterHelperOptions) {
    super();
    this.map = options.map;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [size, ...array]
    sb.emitOp(node, 'UNPACK');
    // [0, size, ...array]
    sb.emitPushInt(node, 0);
    // [arr, size, ...array]
    sb.emitOp(node, 'NEWARRAY');
    // [size, arr, ...array]
    sb.emitOp(node, 'SWAP');
    // [idx, size, arr, ...array]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr, ...array]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr, ...array]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, ...array]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, arr, ...array]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [arr, idx, size, ...array]
          sb.emitOp(node, 'ROT');
          // [idx, arr, idx, size, ...array]
          sb.emitOp(node, 'OVER');
          if (this.withIndex) {
            // [4, idx, arr, idx, size, ...array]
            sb.emitPushInt(node, 4);
            // [value, idx, arr, idx, size, ...array]
            sb.emitOp(node, 'ROLL');
            // [value, idx, value, arr, idx, size, ...array]
            sb.emitOp(node, 'TUCK');
          } else {
            // [3, arr, idx, size, ...array]
            sb.emitPushInt(node, 3);
            // [value, arr, idx, size, ...array]
            sb.emitOp(node, 'ROLL');
            // [value, value, arr, idx, size, ...array]
            sb.emitOp(node, 'DUP');
          }

          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [keepVal, value, arr, idx, size, ...array]
                this.map();
                // [keep, value, arr, idx, size, ...array]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.toBoolean({ type: undefined }),
                );
              },
              whenTrue: () => {
                // [arr, value, arr, idx, size, ...array]
                sb.emitOp(node, 'OVER');
                // [value, arr, arr, idx, size, ...array]
                sb.emitOp(node, 'SWAP');
                // [arr, idx, size, ...array]
                sb.emitOp(node, 'APPEND');
              },
              whenFalse: () => {
                // [arr, idx, size, ...array]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
          // [size, arr, idx, ...array]
          sb.emitOp(node, 'ROT');
          // [idx, size, arr, ...array]
          sb.emitOp(node, 'ROT');
        },
        incrementor: () => {
          // [idx, size, arr, ...array]
          sb.emitOp(node, 'INC');
        },
      }),
    );
    // [size, arr]
    sb.emitOp(node, 'DROP');
    // [arr]
    sb.emitOp(node, 'DROP');
  }
}
