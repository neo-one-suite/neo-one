import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorReduceBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, iterator]
// Output: []
export class RawIteratorReduceBaseHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorReduceBaseHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [iterator, accum, iterator]
          sb.emitOp(node, 'OVER');
          // [boolean, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptions) => {
          // [iterator, accum, iterator]
          sb.emitOp(node, 'OVER');
          // [accum, iterator, iterator]
          sb.emitOp(node, 'SWAP');
          // [accum, iterator]
          this.each(sb.pushValueOptions(innerOptions));
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
