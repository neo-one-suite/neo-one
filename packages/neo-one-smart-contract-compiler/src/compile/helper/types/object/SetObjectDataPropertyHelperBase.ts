import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [val, stringProp, objectVal]
// Output: []
export abstract class SetObjectDataPropertyHelperBase extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, val, stringProp]
    sb.emitHelper(node, sb.pushValueOptions(options), this.getObject(sb));
    // [stringProp, obj, val]
    sb.emitOp(node, 'ROT');
    // [val, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // [1, val, stringProp, obj]
    sb.emitPushInt(node, 1);
    // [propVal, stringProp, obj]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  protected abstract getObject(sb: ScriptBuilder): Helper<Node>;
}
