import ts from 'typescript';
import * as constants from '../../../constants';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class BreakHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    let pc = options.breakPC;
    if (pc === undefined) {
      /* istanbul ignore next */
      sb.reportError(
        node,
        'Something went wrong. Expected a break jump location.',
        DiagnosticCode.SOMETHING_WENT_WRONG,
      );
    } else {
      if (options.finallyPC !== undefined) {
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      }
      sb.emitPushInt(node, constants.BREAK_COMPLETION);
      if (options.finallyPC !== undefined) {
        pc = options.finallyPC;
        sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      }
      sb.emitJmp(node, 'JMP', pc);
    }
  }
}
