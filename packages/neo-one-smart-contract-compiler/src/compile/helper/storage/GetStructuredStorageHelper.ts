import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [keyVal, val]
// Output: [val]
export class GetStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [buffer]
    sb.emitHelper(
      node,
      options,
      sb.helpers.getKeyStructuredStorage({ type: this.type, keyType: this.keyType, knownKeyType: this.knownKeyType }),
    );
    // [value]
    sb.emitHelper(node, options, sb.helpers.getStorage);
    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.handleUndefinedStorage({
        handleUndefined: () => {
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
        handleDefined: () => {
          // [arr]
          sb.emitHelper(node, options, sb.helpers.binaryDeserialize);
          // [1, arr]
          sb.emitPushInt(node, 1);
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
