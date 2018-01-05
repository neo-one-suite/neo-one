import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [errorVal]
// Output: []
export class ThrowHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [throwCompletion]
    sb.emitHelper(
      node,
      sb.pushValueOptions(options),
      sb.helpers.createThrowCompletion,
    );
    // []
    sb.emitHelper(node, options, sb.helpers.handleCompletion);
  }
}
