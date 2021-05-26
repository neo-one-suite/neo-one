import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapForEachWithoutIteratorHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [map]
// Output: []
export class MapForEachWithoutIteratorHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapForEachWithoutIteratorHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const loopOptions = sb.pushValueOptions(options);

    // [arr]
    sb.emitHelper(node, options, sb.helpers.mapToNestedArrWithoutIterator);
    // [arr, arr]
    sb.emitOp(node, 'DUP');
    // [size, arr]
    sb.emitOp(node, 'SIZE');
    // [idx, size, arr]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      loopOptions,
      sb.helpers.forLoop({
        condition: () => {
          // [size, idx, arr]
          sb.emitOp(node, 'SWAP');
          // [size, idx, size, arr]
          sb.emitOp(node, 'TUCK');
          // [idx, size, idx, size, arr]
          sb.emitOp(node, 'OVER');
          // [size > idx, idx, size, arr]
          sb.emitOp(node, 'GT');
        },
        each: (innerOptions) => {
          // [2, idx, size, arr]
          sb.emitPushInt(node, 2);
          // [arr, idx, size, arr]
          sb.emitOp(node, 'PICK');
          // [idx, arr, idx, size, arr]
          sb.emitOp(node, 'OVER');
          // [[key, val], idx, size, arr]
          sb.emitOp(node, 'PICKITEM');
          // [size, key, value, idx, size, arr]
          sb.emitOp(node, 'UNPACK');
          // [key, value, idx, size, arr]
          sb.emitOp(node, 'DROP');
          // [idx, size, arr]
          this.each(sb.noPushValueOptions(innerOptions));
        },
        incrementor: () => {
          // [idx, size, arr]
          sb.emitOp(node, 'INC');
        },
        cleanup: () => {
          // [size, arr]
          sb.emitOp(node, 'DROP');
          // [arr]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
