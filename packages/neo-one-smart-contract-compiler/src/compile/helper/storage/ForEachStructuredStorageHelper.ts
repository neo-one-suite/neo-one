import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper, StructuredStorageBaseHelperOptions } from './StructuredStorageBaseHelper';

export interface ForEachStructuredStorageHelperOptions extends StructuredStorageBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [val]
// Output: [val]
export class ForEachStructuredStorageHelper extends StructuredStorageBaseHelper {
  private readonly each: (options: VisitOptions) => void;

  public constructor({ each, ...rest }: ForEachStructuredStorageHelperOptions) {
    super(rest);
    this.each = each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const size = sb.scope.addUnique();
    // [val, val]
    sb.emitOp(node, 'DUP');
    // [size, val]
    sb.emitHelper(node, options, sb.helpers.getStructuredStorageSize({ type: this.type }));
    // [val]
    sb.scope.set(sb, node, options, size);
    // []
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.forEachStructuredStorageBase({
        type: this.type,
        each: (innerOptions) => {
          // [size, iterator]
          sb.scope.get(sb, node, innerOptions, size);
          // [keyVal, valVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.handleValueStructuredStorage);
          // []
          this.each(sb.noPushValueOptions(innerOptions));
        },
      }),
    );
  }
}
