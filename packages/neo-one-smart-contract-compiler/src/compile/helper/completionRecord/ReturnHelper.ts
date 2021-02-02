import ts from 'typescript';
import * as constants from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: []
export class ReturnHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const finallyPC = options.finallyPC;
    if (finallyPC === undefined) {
      // [completionType, val]
      sb.emitPushInt(node, constants.NORMAL_COMPLETION);
      sb.emitOp(node, 'RET');
    } else {
      // [normal, val]
      sb.emitPushInt(node, constants.NORMAL_COMPLETION);
      // [finally, normal, val]
      sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      sb.emitJmp(node, 'JMP_L', finallyPC);
    }
  }
}
