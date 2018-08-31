import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface ForEachKeyStructuredStorageHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [val]
// Output: [val]
export class ForEachKeyStructuredStorageHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: ForEachKeyStructuredStorageHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.forEachStructuredStorage({
        type: this.type,
        each: (innerOptions) => {
          // [keyVal]
          sb.emitOp(node, 'NIP');
          // []
          this.each(sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
