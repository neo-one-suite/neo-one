import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: []
export class RawIteratorForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorForEachHelperOptions) {
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
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [boolean, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptions) => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [key, iterator]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [iterator, key, iterator]
          sb.emitOp(node, 'OVER');
          // [value, key, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [iterator]
          this.each(innerOptions);
        },
      }),
    );
    // []
    sb.emitOp(node, 'DROP');
  }
}
