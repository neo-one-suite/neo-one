import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrEveryHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// TODO: this has not been tested because it's not used anywhere
// Input: [arr]
// Output: [boolean]
export class ArrEveryWithoutIteratorHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrEveryHelperOptions) {
    super();
    this.map =
      options.map === undefined
        ? () => {
            // do nothing
          }
        : options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [result, arr]
    sb.emitPushBoolean(node, true);
    // [arr, result, arr]
    sb.emitOp(node, 'OVER');
    // [size, result, arr]
    sb.emitOp(node, 'SIZE');
    // [0, size, result, arr]
    sb.emitPushInt(node, 0);
    // [boolean]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, result, arr]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, result, arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, result, arr]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, result, arr]
          sb.emitOp(node, 'GT');
          // [3, size > idx, idx, size, result, arr]
          sb.emitPushInt(node, 3);
          // [result, size > idx, idx, size, result, arr]
          sb.emitOp(node, 'PICK');
          // [boolean, idx, size, result, arr]
          sb.emitOp(node, 'BOOLAND');
        },
        each: (innerOptions) => {
          // [2, idx, size, result, arr]
          sb.emitPushInt(node, 2);
          // [result, idx, size, arr]
          sb.emitOp(node, 'ROLL');
          // [idx, size, arr]
          sb.emitOp(node, 'DROP');
          // [arr, idx, size]
          sb.emitOp(node, 'ROT');
          // [idx, arr, idx, size]
          sb.emitOp(node, 'OVER');
          // [arr, idx, arr, idx, size]
          sb.emitOp(node, 'OVER');
          // [idx, arr, arr, idx, size]
          sb.emitOp(node, 'SWAP');
          // [val, arr, idx, size]
          sb.emitOp(node, 'PICKITEM');
          // [result, arr, idx, size]
          // tslint:disable-next-line: no-map-without-usage
          this.map(sb.pushValueOptions(innerOptions));
          // [arr, result, idx, size]
          sb.emitOp(node, 'SWAP');
          // [size, idx, result, arr]
          sb.emitOp(node, 'REVERSE4');
        },
        incrementor: () => {
          // [idx, size, result, arr]
          sb.emitOp(node, 'SWAP');
          // [idx, size, result, arr]
          sb.emitOp(node, 'INC');
          // [size, idx, result, arr]
          sb.emitOp(node, 'SWAP');
        },
        cleanup: () => {
          // [size, result, arr]
          sb.emitOp(node, 'DROP');
          // [result, arr]
          sb.emitOp(node, 'DROP');
          // [result]
          sb.emitOp(node, 'NIP');

          if (!optionsIn.pushValue) {
            // []
            sb.emitOp(node, 'DROP');
          }
        },
      }),
    );
  }
}
