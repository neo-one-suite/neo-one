import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val, errorVal]
// Output: [completion]
export class CreateCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [2, val, errorVal]
    sb.emitPushInt(node, 2);
    // [completion]
    sb.emitOp(node, 'PACK');
  }
}
