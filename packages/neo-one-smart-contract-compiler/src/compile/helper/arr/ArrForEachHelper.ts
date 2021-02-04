import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ArrForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
  readonly withIndex?: boolean;
}

// Input: [array]
// Output: []
export class ArrForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;
  private readonly withIndex: boolean;

  public constructor(options: ArrForEachHelperOptions) {
    super();
    this.each = options.each;
    this.withIndex = options.withIndex || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.withIndex) {
      // [iterator]
      sb.emitSysCall(node, 'System.Iterator.Create');
      // []
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawIteratorForEach({
          each: (innerOptions) => {
            // [val, idx]
            sb.emitOp(node, 'SWAP');
            // []
            this.each(innerOptions);
          },
        }),
      );
    } else {
      // [enumerator]
      sb.emitSysCall(node, 'System.Enumerator.Create');
      sb.emitHelper(
        node,
        options,
        sb.helpers.rawEnumeratorForEach({
          each: this.each,
        }),
      );
    }
  }
}
