import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorSomeHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawIteratorSomeHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorSomeHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorSomeBase({
        each: (innerOptions) => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [value, iterator]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
          // [iterator, value]
          sb.emitOp(node, 'SWAP');
          // [key, value]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorKey);
          // [result]
          this.each(innerOptions);
        },
      }),
    );
  }
}
