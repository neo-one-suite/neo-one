import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [val]
// Output: [val]
export class CreateIterableIteratorStructuredStorageHelper extends StructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const size = sb.scope.addUnique();
    // [val, val]
    sb.emitOp(node, 'DUP');
    // [size, val]
    sb.emitHelper(node, options, sb.helpers.getStructuredStorageSize({ type: this.type }));
    // [val]
    sb.scope.set(sb, node, options, size);
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.createIterableIteratorStructuredStorageBase({
        type: this.type,
        handleNext: (innerOptions) => {
          // [size, iterator]
          sb.scope.get(sb, node, innerOptions, size);
          // [boolean, keyVal, valVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.handleValueStructuredStorage);
          // [valVal, boolean, keyVal]
          sb.emitOp(node, 'ROT');
          // [keyVal, valVal, boolean]
          sb.emitOp(node, 'ROT');
          // [number, keyVal, valueVal, boolean]
          sb.emitPushInt(node, 2);
          // [arr, boolean]
          sb.emitOp(node, 'PACK');
          // [val, boolean]
          sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
          // [boolean, val]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );
  }
}
