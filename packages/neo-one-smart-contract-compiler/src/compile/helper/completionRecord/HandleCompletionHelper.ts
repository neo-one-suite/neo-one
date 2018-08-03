import ts from 'typescript';
import * as constants from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [completionType, val]
// Output: [val]
export class HandleCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [number, completionType, val]
          sb.emitPushInt(node, constants.NORMAL_COMPLETION);
          // [boolean, val]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenFalse: () => {
          // []
          sb.emitHelper(node, options, sb.helpers.throwCompletion);
        },
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
