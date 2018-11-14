import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorEveryHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawEnumeratorEveryHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorEveryHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorEveryBase({
        each: (innerOptions) => {
          // [value]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [result]
          this.each(innerOptions);
        },
      }),
    );
  }
}
