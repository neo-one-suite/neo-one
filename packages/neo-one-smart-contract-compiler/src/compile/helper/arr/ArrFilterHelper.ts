import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrFilterHelperOptions {
  readonly map: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [arr]
// Output: [arr]
export class ArrFilterHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrFilterHelperOptions) {
    super();
    this.map = options.map;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [size, ...arr]
    sb.emitOp(node, 'UNPACK');
    // [0, size, ...arr]
    sb.emitPushInt(node, 0);
    // [arr, size, ...arr]
    sb.emitOp(node, 'NEWARRAY');
    // [size, arr, ...arr]
    sb.emitOp(node, 'SWAP');
    // [idx, size, arr, ...arr]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr, ...arr]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr, ...arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr, ...arr]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, arr, ...arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [arr, idx, size, ...arr]
          sb.emitOp(node, 'ROT');
          if (this.withIndex) {
            // [idx, arr, idx, size, ...arr]
            sb.emitOp(node, 'OVER');
            // [4, idx, arr, idx, size, ...arr]
            sb.emitPushInt(node, 4);
            // [value, idx, arr, idx, size, ...arr]
            sb.emitOp(node, 'ROLL');
            // [value, idx, value, arr, idx, size, ...arr]
            sb.emitOp(node, 'TUCK');
          } else {
            // [3, arr, idx, size, ...arr]
            sb.emitPushInt(node, 3);
            // [value, arr, idx, size, ...arr]
            sb.emitOp(node, 'ROLL');
            // [value, value, arr, idx, size, ...arr]
            sb.emitOp(node, 'DUP');
          }

          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [keep, value, arr, idx, size, ...arr]
                // tslint:disable-next-line no-map-without-usage
                this.map(innerOptions);
              },
              whenTrue: () => {
                // [arr, value, arr, idx, size, ...arr]
                sb.emitOp(node, 'OVER');
                // [value, arr, arr, idx, size, ...arr]
                sb.emitOp(node, 'SWAP');
                // [arr, idx, size, ...arr]
                sb.emitOp(node, 'APPEND');
              },
              whenFalse: () => {
                // [arr, idx, size, ...arr]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
          // [size, arr, idx, ...arr]
          sb.emitOp(node, 'ROT');
          // [idx, size, arr, ...arr]
          sb.emitOp(node, 'ROT');
        },
        incrementor: () => {
          // [idx, size, arr, ...arr]
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
