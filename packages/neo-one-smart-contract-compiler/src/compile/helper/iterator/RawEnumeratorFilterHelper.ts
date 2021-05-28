import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorFilterHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawEnumeratorFilterHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorFilterHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const handleResult = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.if({
          condition: () => {
            // [boolean, accum, val]
            // tslint:disable-next-line no-map-without-usage
            this.each(innerOptions);
          },
          whenTrue: () => {
            // [accum, val, accum]
            sb.emitOp(node, 'TUCK');
            // [val, accum, accum]
            sb.emitOp(node, 'SWAP');
            // [accum]
            sb.emitOp(node, 'APPEND');
          },
          whenFalse: () => {
            // [accum]
            sb.emitOp(node, 'NIP');
          },
        }),
      );
    };

    // [accum, enumerator]
    sb.emitOp(node, 'NEWARRAY0');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawEnumeratorReduce({
        each: (innerOptions) => {
          // [val, accum, val]
          sb.emitOp(node, 'OVER');
          // [accum]
          handleResult(innerOptions);
        },
      }),
    );
  }
}
