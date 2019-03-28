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

    // [0]
    sb.emitPushInt(node, 0);
    // [arr]
    sb.emitOp(node, 'NEWARRAY');
    // [size, arr]
    sb.emitPushInt(node, 0);
    // [prefix, size, arr]
    sb.emitPushString(node, this.prefix);
    // [3, prefix, size, arr]
    sb.emitPushInt(node, 3);
    // [struct]
    sb.emitOp(node, 'PACK');
    sb.emitOp(node, 'NEWSTRUCT');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
