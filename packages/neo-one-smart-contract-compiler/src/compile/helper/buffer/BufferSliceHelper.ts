import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface BufferSliceHelperOptions {
  readonly hasEnd?: boolean;
}

// Input: [start, end?, buffer]
// Output: [number]
export class BufferSliceHelper extends Helper {
  private readonly hasEnd: boolean;
  public constructor({ hasEnd = false }: BufferSliceHelperOptions) {
    super();
    this.hasEnd = hasEnd;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    if (this.hasEnd) {
      // [buffer, start, end]
      sb.emitOp(node, 'ROT');
      // [start, buffer, end]
      sb.emitOp(node, 'SWAP');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [start, buffer, start, end]
            sb.emitOp(node, 'TUCK');
            // [0, start, buffer, start, end]
            sb.emitPushInt(node, 0);
            // [start < 0, buffer, start, end]
            sb.emitOp(node, 'LT');
          },
          whenTrue: () => {
            // [buffer, start, buffer, end]
            sb.emitOp(node, 'TUCK');
            // [size, start, buffer, end]
            sb.emitOp(node, 'SIZE');
            // [start, buffer, end]
            sb.emitOp(node, 'ADD');
            // [buffer, start, end]
            sb.emitOp(node, 'SWAP');
          },
        }),
      );
      // [end, buffer, start]
      sb.emitOp(node, 'ROT');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [end, buffer, end, start]
            sb.emitOp(node, 'TUCK');
            // [0, end, buffer, end, start]
            sb.emitPushInt(node, 0);
            // [end < 0, buffer, end, start]
            sb.emitOp(node, 'LT');
          },
          whenTrue: () => {
            // [buffer, end, buffer, start]
            sb.emitOp(node, 'TUCK');
            // [size, end, buffer, start]
            sb.emitOp(node, 'SIZE');
            // [end, buffer, start]
            sb.emitOp(node, 'ADD');
            // [buffer, end, start]
            sb.emitOp(node, 'SWAP');
          },
        }),
      );
      // [start, buffer, end]
      sb.emitOp(node, 'ROT');
      // [end, start, buffer]
      sb.emitOp(node, 'ROT');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [end, start, end, buffer]
            sb.emitOp(node, 'TUCK');
            // [start, end, start, end, buffer]
            sb.emitOp(node, 'OVER');
            // [end <= start, start, end, buffer]
            sb.emitOp(node, 'LTE');
          },
          whenTrue: () => {
            // [end, buffer]
            sb.emitOp(node, 'DROP');
            // [buffer]
            sb.emitOp(node, 'DROP');
            // []
            sb.emitOp(node, 'DROP');
            // [buffer]
            sb.emitPushBuffer(node, Buffer.alloc(0, 0));
          },
          whenFalse: () => {
            // [start, end, start, buffer]
            sb.emitOp(node, 'TUCK');
            // [left, start, buffer]
            sb.emitOp(node, 'SUB');
            // [buffer, left, start]
            sb.emitOp(node, 'ROT');
            // [start, buffer, left]
            sb.emitOp(node, 'ROT');
            // [buffer, start, buffer, left]
            sb.emitOp(node, 'OVER');
            // [length, start, buffer, left]
            sb.emitOp(node, 'SIZE');
            // [start, length, buffer, left]
            sb.emitOp(node, 'SWAP');
            // [right, buffer, left]
            sb.emitOp(node, 'SUB');
            // [buffer, left]
            sb.emitOp(node, 'RIGHT');
            // [left, buffer]
            sb.emitOp(node, 'SWAP');
            // [buffer]
            sb.emitOp(node, 'LEFT');
          },
        }),
      );
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [start, start, buffer]
            sb.emitOp(node, 'DUP');
            // [0, start, start, buffer]
            sb.emitPushInt(node, 0);
            // [start < 0, start, buffer]
            sb.emitOp(node, 'LT');
          },
          whenTrue: () => {
            // [-1, start, buffer]
            sb.emitPushInt(node, -1);
            // [right, buffer]
            sb.emitOp(node, 'MUL');
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [right, buffer, right]
                  sb.emitOp(node, 'TUCK');
                  // [buffer, right, buffer, right]
                  sb.emitOp(node, 'OVER');
                  // [length, right, buffer, right]
                  sb.emitOp(node, 'SIZE');
                  // [right > length, buffer, right]
                  sb.emitOp(node, 'GT');
                },
                whenTrue: () => {
                  // [buffer]
                  sb.emitOp(node, 'NIP');
                },
                whenFalse: () => {
                  // [right, buffer]
                  sb.emitOp(node, 'SWAP');
                  // [buffer]
                  sb.emitOp(node, 'RIGHT');
                },
              }),
            );
          },
          whenFalse: () => {
            // [buffer, start, buffer]
            sb.emitOp(node, 'OVER');
            // [length, start, buffer]
            sb.emitOp(node, 'SIZE');
            // [start, length, buffer]
            sb.emitOp(node, 'SWAP');
            // [right, buffer]
            sb.emitOp(node, 'SUB');
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [right, buffer, right]
                  sb.emitOp(node, 'TUCK');
                  // [0, right, buffer, right]
                  sb.emitPushInt(node, 0);
                  // [right < 0, buffer, right]
                  sb.emitOp(node, 'LTE');
                },
                whenTrue: () => {
                  // [right]
                  sb.emitOp(node, 'DROP');
                  // []
                  sb.emitOp(node, 'DROP');
                  // [buffer]
                  sb.emitPushBuffer(node, Buffer.alloc(0, 0));
                },
                whenFalse: () => {
                  // [right, buffer]
                  sb.emitOp(node, 'SWAP');
                  // [buffer]
                  sb.emitOp(node, 'RIGHT');
                },
              }),
            );
          },
        }),
      );
    }
  }
}
