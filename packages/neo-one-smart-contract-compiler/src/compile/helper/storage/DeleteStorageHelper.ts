import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [boolean]
export class DeleteStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [keyBuffer]
      sb.emitOp(node, 'DUP');
      // [value, keyBuffer]
      sb.emitHelper(node, options, sb.helpers.getStorage);
      sb.emitHelper(
        node,
        options,
        sb.helpers.handleUndefinedStorage({
          handleUndefined: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [boolean]
            sb.emitPushBoolean(node, false);
          },
          handleDefined: () => {
            // [keyBuffer]
            sb.emitOp(node, 'DROP');
            // [context, keyBuffer]
            sb.emitSysCall(node, 'Neo.Storage.GetContext');
            // []
            sb.emitSysCall(node, 'Neo.Storage.Delete');
            // [boolean]
            sb.emitPushBoolean(node, true);
          },
        }),
      );
    } else {
      // [context, keyBuffer]
      sb.emitSysCall(node, 'Neo.Storage.GetContext');
      // []
      sb.emitSysCall(node, 'Neo.Storage.Delete');
    }
  }
}
