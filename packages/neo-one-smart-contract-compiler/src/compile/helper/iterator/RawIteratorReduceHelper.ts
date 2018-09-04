import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, iterator]
// Output: [accum]
export class RawIteratorReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorReduceHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduceBase({
        each: (innerOptions) => {
          // [iterator, accum, iterator]
          sb.emitOp(node, 'OVER');
          // [value, accum, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [iterator, value, accum]
          sb.emitOp(node, 'ROT');
          // [key, value, accum]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [accum, key, value]
          sb.emitOp(node, 'ROT');
          // [accum]
          this.each(innerOptions);
        },
      }),
    );
  }
}
