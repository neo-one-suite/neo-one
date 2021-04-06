import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachHelperOptions {
  readonly deserializeKey?: boolean;
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: []
export class RawIteratorForEachHelper extends Helper {
  private readonly deserializeKey: boolean;
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorForEachHelperOptions) {
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
          // [val]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [iterator, val]
          sb.emitOp(node, 'OVER');
          // [key, val]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorKey);
          if (this.deserializeKey) {
            // [key, val]
            sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
          }
          // []
          this.each(innerOptions);
        },
      }),
    );
  }
}
