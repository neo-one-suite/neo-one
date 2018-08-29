import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetStorageBaseHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [context, keyBuffer]
    sb.emitSysCall(node, 'Neo.Storage.GetReadOnlyContext');
    // [iterator]
    sb.emitSysCall(node, 'Neo.Storage.Find');
    // [iterator, iterator]
    sb.emitOp(node, 'DUP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        whenTrue: () => {
          // [value]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
        },
        whenFalse: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [value]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
        },
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
