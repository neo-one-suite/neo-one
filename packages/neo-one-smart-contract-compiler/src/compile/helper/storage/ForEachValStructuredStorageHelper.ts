import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface ForEachValStructuredStorageHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [val]
// Output: [val]
export class ForEachValStructuredStorageHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: ForEachValStructuredStorageHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.forEachStructuredStorageBase({
        type: this.type,
        each: (innerOptions) => {
          // [valVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.handleValValueStructuredStorage);
          // []
          this.each(sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
