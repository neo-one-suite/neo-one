import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: []
// Output: [objectVal]
export class CreateArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [Array]
      sb.emitHelper(
        node,
        options,
        sb.helpers.getGlobalProperty({ property: 'Array' }),
      );
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.new({ noArgs: true }));
    }
  }
}
