import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [boolean]
export class DeleteStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

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
          if (optionsIn.pushValue) {
            // [boolean]
            sb.emitPushBoolean(node, false);
          }
        },
        handleDefined: () => {
          // [keyBuffer]
          sb.emitOp(node, 'DROP');
          // [map, keyBuffer]
          sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CacheStorage }));
          // [keyBuffer, map, keyBuffer]
          sb.emitOp(node, 'OVER');
          // [buffer, keyBuffer, map, keyBuffer]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
          // [keyBuffer]
          sb.emitOp(node, 'SETITEM');
          // [context, keyBuffer]
          sb.emitSysCall(node, 'Neo.Storage.GetContext');
          // []
          sb.emitSysCall(node, 'Neo.Storage.Delete');
          if (optionsIn.pushValue) {
            // [boolean]
            sb.emitPushBoolean(node, true);
          }
        },
      }),
    );
  }
}
