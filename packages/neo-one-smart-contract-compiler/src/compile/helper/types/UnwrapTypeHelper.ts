import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [val]
// Output: [type]
export class UnwrapTypeHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [0, val]
    sb.emitPushInt(node, 0);
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
