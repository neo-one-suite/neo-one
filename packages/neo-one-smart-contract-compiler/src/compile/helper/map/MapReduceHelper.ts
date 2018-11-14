import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface MapReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, map]
// Output: [accum]
export class MapReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: MapReduceHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map, accum]
    sb.emitOp(node, 'SWAP');
    // [iterator, accum]
    sb.emitSysCall(node, 'Neo.Iterator.Create');
    // [accum, iterator]
    sb.emitOp(node, 'SWAP');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduce({
        each: this.each,
      }),
    );
  }
}
