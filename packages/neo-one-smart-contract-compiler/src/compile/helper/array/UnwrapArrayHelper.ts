import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [objectVal]
// Output: [arr]
export class UnwrapArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getArrayValue);
  }
}
