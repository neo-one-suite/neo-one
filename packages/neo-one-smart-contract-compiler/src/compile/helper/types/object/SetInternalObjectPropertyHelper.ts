import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetInternalObjectPropertyHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, val, stringProp]
    sb.emitHelper(
      node,
      sb.pushValueOptions(options),
      sb.helpers.getInternalObject,
    );
    // [stringProp, obj, val]
    sb.emitOp(node, 'ROT');
    // [val, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
