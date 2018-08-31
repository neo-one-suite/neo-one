import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface ForEachStructuredStorageBaseHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [val]
// Output: [val]
export class ForEachStructuredStorageBaseHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: ForEachStructuredStorageBaseHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [iterator]
    sb.emitHelper(node, options, sb.helpers.createIteratorStructuredStorage({ type: this.type }));
    // []
    sb.emitHelper(node, options, sb.helpers.rawIteratorForEachBase({ each: this.each }));
    if (options.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapUndefined);
    }
  }
}
