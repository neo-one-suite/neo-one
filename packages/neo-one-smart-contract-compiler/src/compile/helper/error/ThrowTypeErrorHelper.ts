import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: []
// Output: []
export class ThrowTypeErrorHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // ['TypeError']
    sb.emitPushString(node, 'TypeError');
    // [value]
    sb.emitHelper(node, options, sb.helpers.createString);
    // []
    sb.emitHelper(node, options, sb.helpers.throw);
  }
}
