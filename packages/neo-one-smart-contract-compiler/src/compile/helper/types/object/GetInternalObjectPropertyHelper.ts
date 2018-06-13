import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [stringProp, objectVal]
// Output: [val]
export class GetInternalObjectPropertyHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');
      return;
    }

    // [objectVal, stringProp]
    sb.emitOp(node, 'SWAP');
    // [iobj, stringProp]
    sb.emitHelper(node, options, sb.helpers.getInternalObject);
    // [stringProp, iobj]
    sb.emitOp(node, 'SWAP');
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
