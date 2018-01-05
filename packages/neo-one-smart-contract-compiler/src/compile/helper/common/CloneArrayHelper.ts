import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [array]
// Output: [array]
export class CloneArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [array]
    sb.emitOp(node, 'UNPACK');
    // [...array]
    sb.emitOp(node, 'PACK');
  }
}
