import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [accum, arr]
// Output: [accum]
export class ArrReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrReduceHelperOptions) {
    super();
    this.each = options.each;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [arr, accum]
    sb.emitOp(node, 'SWAP');
    // [map, accum]
    sb.emitHelper(node, options, sb.helpers.arrToMap);
    if (this.withIndex) {
      // [iterator, accum]
      sb.emitSysCall(node, 'System.Iterator.Create');
      // [accum, iterator]
      sb.emitOp(node, 'SWAP');
      // [accum]
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawIteratorReduce({
          each: (innerOptions) => {
            // [val, accum, idx]
            sb.emitOp(node, 'ROT');
            // [accum, val, idx]
            sb.emitOp(node, 'SWAP');
            // [accum]
            this.each(innerOptions);
          },
        }),
      );
    } else {
      // [enumerator, accum]
      sb.emitSysCall(node, 'System.Iterator.Create');
      // [accum, enumerator]
      sb.emitOp(node, 'SWAP');
      // [accum]
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawEnumeratorReduce({
          each: this.each,
        }),
      );
    }
  }
}
