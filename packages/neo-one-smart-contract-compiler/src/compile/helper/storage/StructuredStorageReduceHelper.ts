import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface StructuredStorageReduceHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, val]
// Output: [accum]
export class StructuredStorageReduceHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: StructuredStorageReduceHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const size = sb.scope.addUnique();
    // [val, accum, val]
    sb.emitOp(node, 'OVER');
    // [size, accum, val]
    sb.emitHelper(node, options, sb.helpers.getStructuredStorageSize({ type: this.type }));
    // [accum, val]
    sb.scope.set(sb, node, options, size);
    // [accum]
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.structuredStorageReduceBase({
        type: this.type,
        each: (innerOptions) => {
          // [iterator, accum]
          sb.emitOp(node, 'SWAP');
          // [size, iterator, accum]
          sb.scope.get(sb, node, innerOptions, size);
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [boolean, keyVal, valVal, accum]
                sb.emitHelper(node, innerOptions, sb.helpers.handleValueStructuredStorage);
              },
              whenTrue: () => {
                // [accum, keyVal, valVal]
                sb.emitOp(node, 'ROT');
                // []
                this.each(innerOptions);
              },
              whenFalse: () => {
                // [valVal, accum]
                sb.emitOp(node, 'DROP');
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
