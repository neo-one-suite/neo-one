import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorReduceHelperOptions {
  readonly deserializeKey?: boolean;
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, iterator]
// Output: [accum]
export class RawIteratorReduceHelper extends Helper {
  private readonly deserializeKey: boolean;
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorReduceHelperOptions) {
    super();
    this.each = options.each;
    this.deserializeKey = options.deserializeKey ?? false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorReduceBase({
        each: (innerOptions) => {
          // [iterator, accum, iterator]
          sb.emitOp(node, 'OVER');
          // [value, accum, iterator]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [iterator, value, accum]
          sb.emitOp(node, 'ROT');
          // [key, value, accum]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorKey);
          if (this.deserializeKey) {
            // [key, value, accum]
            sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
          }
          // [accum, key, value]
          sb.emitOp(node, 'ROT');
          // [accum]
          this.each(innerOptions);
        },
      }),
    );
  }
}
