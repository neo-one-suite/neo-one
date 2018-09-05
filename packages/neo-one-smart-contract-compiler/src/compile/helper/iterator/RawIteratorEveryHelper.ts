import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorEveryHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawIteratorEveryHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorEveryHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorEveryBase({
        each: (innerOptions) => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [value, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [iterator, value]
          sb.emitOp(node, 'SWAP');
          // [key, value]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          // [result]
          this.each(innerOptions);
        },
      }),
    );
  }
}
