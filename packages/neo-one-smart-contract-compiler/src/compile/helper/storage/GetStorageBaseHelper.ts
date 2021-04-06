import ts from 'typescript';
import { FindOptions } from '../../../types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetStorageBaseHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number, keyBuffer]
    sb.emitPushInt(node, FindOptions.None);
    // [keyBuffer, number]
    sb.emitOp(node, 'SWAP');
    // [context, keyBuffer, number]
    sb.emitSysCall(node, 'System.Storage.GetReadOnlyContext');
    // [iterator]
    sb.emitSysCall(node, 'System.Storage.Find');
    // [iterator, iterator]
    sb.emitOp(node, 'DUP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, iterator]
          sb.emitSysCall(node, 'System.Iterator.Next');
        },
        whenTrue: () => {
          // [value]
          sb.emitHelper(node, options, sb.helpers.getMapIteratorValue);
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
