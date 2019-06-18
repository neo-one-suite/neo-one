import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface StructuredStorageReduceValHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, val]
// Output: [accum]
export class StructuredStorageReduceValHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: StructuredStorageReduceValHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.structuredStorageReduceBase({
        type: this.type,
        each: (innerOptions) => {
          // [iterator, accum]
          sb.emitOp(node, 'SWAP');
          // [accum]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [boolean, valVal, accum]
                sb.emitHelper(node, innerOptions, sb.helpers.handleValValueStructuredStorage);
              },
              whenTrue: () => {
                // [accum, valVal]
                sb.emitOp(node, 'SWAP');
                // [accum]
                this.each(innerOptions);
              },
              whenFalse: () => {
                // [accum]
                sb.emitOp(node, 'DROP');
              },
            }),
          );
        },
      }),
    );
  }
}
