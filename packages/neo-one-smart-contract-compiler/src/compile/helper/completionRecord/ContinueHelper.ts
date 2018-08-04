import ts from 'typescript';
import * as constants from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class ContinueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    let pc = options.continuePC;
    if (pc === undefined) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);
    } else {
      if (options.finallyPC !== undefined) {
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      }
      sb.emitPushInt(node, constants.CONTINUE_COMPLETION);
      if (options.finallyPC !== undefined) {
        pc = options.finallyPC;
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      }
      sb.emitJmp(node, 'JMP', pc);
    }
  }
}
