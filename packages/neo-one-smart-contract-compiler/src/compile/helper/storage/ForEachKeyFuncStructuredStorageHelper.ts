import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [objectVal, val]
// Output: [val]
export class ForEachKeyFuncStructuredStorageHelper extends StructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const size = sb.scope.addUnique();
    // [val, objectVal, val]
    sb.emitOp(node, 'OVER');
    // [size, objectVal, val]
    sb.emitHelper(node, options, sb.helpers.getStructuredStorageSize({ type: this.type }));
    // [objectVal, val]
    sb.scope.set(sb, node, options, size);
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.forEachFuncStructuredStorageBase({
        type: this.type,
        handleNext: (innerOptions) => {
          // [size, iterator]
          sb.scope.get(sb, node, innerOptions, size);
          // [keyVal, valVal]
          sb.emitHelper(node, innerOptions, sb.helpers.handleValueStructuredStorage);
          // [keyVal]
          sb.emitOp(node, 'NIP');
          // [1, keyVal]
          sb.emitPushInt(node, 1);
          // [argsarr]
          sb.emitOp(node, 'PACK');
        },
      }),
    );
  }
}
