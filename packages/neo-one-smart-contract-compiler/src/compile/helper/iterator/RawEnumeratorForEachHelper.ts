import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [enumerator]
// Output: []
export class RawEnumeratorForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorForEachHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEachBase({
        each: (innerOptions) => {
          // [val]
          sb.emitSysCall(node, 'System.Enumerator.Value');
          // []
          this.each(sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
