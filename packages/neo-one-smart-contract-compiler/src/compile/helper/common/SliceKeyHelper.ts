import { common, StackItemType } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [keyBuffer]
export class SliceKeyHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [keyBuffer, keyBuffer]
          sb.emitOp(node, 'DUP');
          // [size, keyBuffer]
          sb.emitOp(node, 'SIZE');
          // [maxSize, size, keyBuffer]
          sb.emitPushInt(node, common.MAP_STACK_ITEM_MAX_KEY_SIZE);
          // [bool, keyBuffer]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [maxSize, keyBuffer]
          sb.emitPushInt(node, common.MAP_STACK_ITEM_MAX_KEY_SIZE);
          // [keyBuffer]
          sb.emitOp(node, 'LEFT');
          // [keyBuffer]
          sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
        },
      }),
    );
  }
}
