import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [completion]
export class CreateNormalCompletionHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [undefinedVal, val]
    sb.emitHelper(node, options, sb.helpers.createUndefined);
    // [val, undefinedVal]
    sb.emitOp(node, 'SWAP');
    // [completion]
    sb.emitHelper(node, options, sb.helpers.createCompletion);
  }
}
