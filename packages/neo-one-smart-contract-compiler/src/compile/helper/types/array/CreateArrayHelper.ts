import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: []
// Output: [arrayVal]
export class CreateArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [arr]
      sb.emitOp(node, 'NEWARRAY0');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    }
  }
}
