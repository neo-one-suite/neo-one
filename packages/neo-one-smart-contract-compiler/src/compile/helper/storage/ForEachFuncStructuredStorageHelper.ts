import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [objectVal, val]
// Output: [val]
export class ForEachFuncStructuredStorageHelper extends StructuredStorageBaseHelper {
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
          // [boolean, keyVal, valVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.handleValueStructuredStorage);
          // [keyVal, boolean, valVal]
          sb.emitOp(node, 'SWAP');
          // [valVal, keyVal, boolean]
          sb.emitOp(node, 'ROT');
          // [2, valueVal, keyVal, boolean]
          sb.emitPushInt(node, 2);
          // [argsarr, boolean]
          sb.emitOp(node, 'PACK');
          // [boolean, argsarr]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );
  }
}
