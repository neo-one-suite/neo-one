import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorSomeHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [enumerator]
// Output: [boolean]
export class RawEnumeratorSomeHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorSomeHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorSomeBase({
        each: (innerOptions) => {
          // [value]
          sb.emitSysCall(node, 'System.Enumerator.Value');
          // [result]
          this.each(innerOptions);
        },
      }),
    );
  }
}
