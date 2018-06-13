import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrForEachHelperOptions {
  each: () => void;
  withIndex?: boolean;
}

// Input: [array]
// Output: []
export class ArrForEachHelper extends Helper {
  private readonly each: () => void;
  private readonly withIndex: boolean;

  constructor(options: ArrForEachHelperOptions) {
    super();
    this.each = options.each;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [size, ...array]
    sb.emitOp(node, 'UNPACK');
    // [idx, size, ...array]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, ...array]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, ...array]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, ...array]
          sb.emitOp(node, 'OVER');
          // size > idx
          // [size > idx, idx, size, ...array]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [value, idx, size, ...array]
          sb.emitOp(node, 'ROT');
          if (this.withIndex) {
            // [idx, value, idx, size, ...array]
            sb.emitOp(node, 'OVER');
            // [value, idx, idx, size, ...array]
            sb.emitOp(node, 'SWAP');
          }
          // [idx, size, ...array]
          this.each();
        },
        incrementor: () => {
          // [idx, size, ...array]
          sb.emitOp(node, 'INC');
        },
      }),
    );
    // [size]
    sb.emitOp(node, 'DROP');
    // []
    sb.emitOp(node, 'DROP');
  }
}
