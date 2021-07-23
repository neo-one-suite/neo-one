import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrRangeHelperOptions {
  readonly map?: (options: VisitOptions) => void;
}

// Input: [end]
// Output: [arr]
export class ArrRangeHelper extends Helper {
  private readonly map: (options: VisitOptions) => void;

  public constructor(options: ArrRangeHelperOptions) {
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

    // [arr, end]
    sb.emitOp(node, 'NEWARRAY0');
    // [end, arr]
    sb.emitOp(node, 'SWAP');
    // [idx, end, arr]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [end, idx, end, arr]
          sb.emitOp(node, 'OVER');
          // [idx, end, idx, end, arr]
          sb.emitOp(node, 'OVER');
          // [end > idx, idx, end, arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [2, idx, end, arr]
          sb.emitPushInt(node, 2);
          // [arr, idx, end, arr]
          sb.emitOp(node, 'PICK');
          // [idx, arr, idx, end, arr]
          sb.emitOp(node, 'OVER');
          // tslint:disable-next-line no-map-without-usage
          this.map(innerOptions);
          // [idx, end, arr]
          sb.emitOp(node, 'APPEND');
          // [idx, end, arr]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [end, arr]
          sb.emitOp(node, 'DROP');
          // [arr]
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
