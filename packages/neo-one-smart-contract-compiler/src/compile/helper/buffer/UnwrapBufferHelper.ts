import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [objectVal]
// Output: [byteArray]
export class UnwrapBufferHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [byteArray]
    sb.emitHelper(node, options, sb.helpers.getBufferValue);
  }
}
