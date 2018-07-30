import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [value]
// Must not be undefined or null
export class UnwrapValHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [1, val]
    sb.emitPushInt(node, 1);
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
