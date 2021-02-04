import { StackItemType } from '@neo-one/client-common';
import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [val, stringProp, objectVal]
// Output: []
export abstract class SetObjectDataPropertyHelperBase extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, val, stringProp]
    sb.emitHelper(node, sb.pushValueOptions(options), this.getObject(sb));
    // [stringProp, obj, val]
    sb.emitOp(node, 'ROT');
    // [stringProp, obj, val]
    sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
    // [val, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // [1, val, stringProp, obj]
    sb.emitPushInt(node, 1);
    // [propVal, stringProp, obj]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  protected abstract getObject(sb: ScriptBuilder): Helper;
}
