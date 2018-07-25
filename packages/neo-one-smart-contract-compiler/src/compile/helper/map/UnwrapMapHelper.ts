import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal]
// Output: [arr]
export class UnwrapMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getMapValue);
  }
}
