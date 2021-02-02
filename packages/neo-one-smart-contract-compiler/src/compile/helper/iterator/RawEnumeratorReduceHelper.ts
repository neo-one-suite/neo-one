import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, iterator]
// Output: [accum]
export class RawEnumeratorReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorReduceHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduceBase({
        each: (innerOptions) => {
          // [enumerator, accum]
          sb.emitOp(node, 'SWAP');
          // [value, accum]
          sb.emitSysCall(node, 'System.Enumerator.Value');
          // [accum, value]
          sb.emitOp(node, 'SWAP');
          // [accum]
          this.each(innerOptions);
        },
      }),
    );
  }
}
