import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [completion]
// Output: [val]
export class PickCompletionValHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [completion, completion]
      sb.emitOp(node, 'DUP');
    }

    sb.emitHelper(node, options, sb.helpers.handleCompletion);

    if (options.pushValue) {
      sb.emitHelper(node, options, sb.helpers.getCompletionVal);
    }
  }
}
