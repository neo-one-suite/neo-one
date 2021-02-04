import { StackItemType } from '@neo-one/client-common';
import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [stringArr, objectVal]
// Output: []
export abstract class OmitObjectPropertiesHelperBase extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const objectValName = sb.scope.addUnique();
    // [objectVal, stringArr]
    sb.emitOp(node, 'SWAP');
    // [stringArr]
    sb.scope.set(sb, node, options, objectValName);

    sb.emitHelper(
      node,
      options,
      sb.helpers.arrForEach({
        each: () => {
          // [objectVal, string]
          sb.scope.get(sb, node, options, objectValName);
          // [obj, string]
          sb.emitHelper(node, options, this.getObject(sb));
          // [string, obj]
          sb.emitOp(node, 'SWAP');
          // [string, obj]
          sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
          // []
          sb.emitOp(node, 'REMOVE');
        },
      }),
    );
  }

  protected abstract getObject(sb: ScriptBuilder): Helper;
}
