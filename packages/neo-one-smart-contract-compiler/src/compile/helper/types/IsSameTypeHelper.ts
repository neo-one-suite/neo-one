import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val0, val1]
// Output: [boolean]
export class IsSameTypeHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');
      return;
    }

    // [type0, val1]
    sb.emitHelper(node, options, sb.helpers.unwrapType);
    // [val1, type0]
    sb.emitOp(node, 'SWAP');
    // [type1, type0]
    sb.emitHelper(node, options, sb.helpers.unwrapType);
    // [boolean]
    sb.emitOp(node, 'EQUAL');
  }
}
