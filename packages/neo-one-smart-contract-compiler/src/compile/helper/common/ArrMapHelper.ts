import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrMapHelperOptions {
  readonly map: () => void;
  readonly withIndex?: boolean;
}

// Input: [array]
// Output: [array]
export class ArrMapHelper extends Helper {
  private readonly map: () => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrMapHelperOptions) {
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
          // [idx, idx, size, ...array]
          sb.emitOp(node, 'DUP');
          // [3, idx, idx, size, ...array]
          sb.emitPushInt(node, 3);
          // [idx + 3, idx, size, ...array]
          sb.emitOp(node, 'ADD');
          if (this.withIndex) {
            // [idx, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'OVER');
            // [idx, idx, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'DUP');
            // [4, idx, idx, idx + 3, idx, size, ...array]
            sb.emitPushInt(node, 4);
            // [idx + 4, idx, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'ADD');
            // [value, idx, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'ROLL');
          } else {
            // [idx + 3, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'DUP');
            // [value, idx + 3, idx, size, ...array]
            sb.emitOp(node, 'ROLL');
          }
          // [value, idx + 3, idx, size, ...array]
          // tslint:disable-next-line no-map-without-usage
          this.map();
          // [idx + 3, value, idx, size, ...array]
          sb.emitOp(node, 'SWAP');
          // [value, idx, size, ...array]
          sb.emitOp(node, 'XTUCK');
          // [idx, size, ...array]
          sb.emitOp(node, 'DROP');
        },
        incrementor: () => {
          // [idx, size, ...array]
          sb.emitOp(node, 'INC');
        },
      }),
    );
    // [size, ...array]
    sb.emitOp(node, 'DROP');
    // [array]
    sb.emitOp(node, 'PACK');
  }
}
