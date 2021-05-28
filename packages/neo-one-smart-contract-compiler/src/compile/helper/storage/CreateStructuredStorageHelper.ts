import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface CreateStructuredStorageHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly prefix: string;
}

// Input: []
// Output: [value]
export class CreateStructuredStorageHelper extends StructuredStorageBaseHelper {
  private readonly prefix: string;

  public constructor({ prefix, ...rest }: CreateStructuredStorageHelperOptions) {
    super(rest);
    this.prefix = prefix;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }

    // [arr]
    sb.emitOp(node, 'NEWARRAY0');
    // [size, arr]
    sb.emitPushInt(node, 0);
    // [prefix, size, arr]
    sb.emitPushString(node, this.prefix);
    // [3, prefix, size, arr]
    sb.emitPushInt(node, 3);
    // [struct, prefix, size, arr]
    sb.emitOp(node, 'NEWSTRUCT');
    // [struct, prefix, struct, size, arr]
    sb.emitOp(node, 'TUCK');
    // [prefix, struct, struct, size, arr]
    sb.emitOp(node, 'SWAP');
    // [0, prefix, struct, struct, size, arr]
    sb.emitPushInt(node, 0);
    // [prefix, 0, struct, struct, size, arr]
    sb.emitOp(node, 'SWAP');
    // [struct, size, arr]
    sb.emitOp(node, 'SETITEM');
    // [struct, size, struct, arr]
    sb.emitOp(node, 'TUCK');
    // [size, struct, struct, arr]
    sb.emitOp(node, 'SWAP');
    // [1, size, struct, struct, arr]
    sb.emitPushInt(node, 1);
    // [size, 1, struct, struct, arr]
    sb.emitOp(node, 'SWAP');
    // [struct, arr]
    sb.emitOp(node, 'SETITEM');
    // [struct, arr, struct]
    sb.emitOp(node, 'TUCK');
    // [arr, struct, struct]
    sb.emitOp(node, 'SWAP');
    // [2, arr, struct, struct]
    sb.emitPushInt(node, 2);
    // [arr, 2, struct, struct]
    sb.emitOp(node, 'SWAP');
    // [struct]
    sb.emitOp(node, 'SETITEM');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
