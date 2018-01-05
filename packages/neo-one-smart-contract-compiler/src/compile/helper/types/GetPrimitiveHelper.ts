import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [val]
// Output: [value]
export abstract class GetPrimitiveHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [1, val]
    sb.emitPushInt(node, 1);
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
