import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachKeyHelperOptions {
  readonly deserializeKey?: boolean;
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: []
export class RawIteratorForEachKeyHelper extends Helper {
  private readonly deserializeKey: boolean;
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorForEachKeyHelperOptions) {
    super();
    this.each = options.each;
    this.deserializeKey = options.deserializeKey ?? false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEachBase({
        each: (innerOptions) => {
          // [key]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          if (this.deserializeKey) {
            // [key]
            sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          }
          // []
          this.each(innerOptions);
        },
      }),
    );
  }
}
