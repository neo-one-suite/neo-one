import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: []
// Output: [arrayVal]
export class CreateArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [0]
      sb.emitPushInt(node, 0);
      // [arr]
      sb.emitOp(node, 'NEWARRAY');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    }
  }
}
