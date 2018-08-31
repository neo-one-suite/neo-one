import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [keyVal, val]
// Output: [val]
export class HasStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }
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
          // [boolean]
          sb.emitPushBoolean(node, false);
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapBoolean);
        },
        handleDefined: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, true);
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapBoolean);
        },
      }),
    );
  }
}
