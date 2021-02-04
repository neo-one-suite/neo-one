import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import * as constants from '../../../constants';
import { ProgramCounter } from '../../pc';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

const isValidParent = (catchPC?: ProgramCounter, finallyPC?: ProgramCounter, node?: ts.Node) =>
  node !== undefined &&
  ((ts.isTryStatement(node) && (catchPC !== undefined || finallyPC !== undefined)) ||
    tsUtils.guards.isFunctionLikeDeclarationBase(node) ||
    ts.isArrowFunction(node) ||
    ts.isSourceFile(node));

// Input: [errorVal]
// Output: []
export class ThrowCompletionBaseHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const finallyPC = options.finallyPC;
    const catchPC = options.catchPC;
    let parent = tsUtils.node.getParent(node) as ts.Node | undefined;
    // tslint:disable-next-line no-loop-statement
    while (parent !== undefined && !isValidParent(catchPC, finallyPC, parent)) {
      parent = tsUtils.node.getParent(parent);
    }

    if (catchPC !== undefined) {
      sb.emitPushInt(node, constants.THROW_COMPLETION);
      sb.emitJmp(node, 'JMP_L', catchPC);
    } else if (finallyPC !== undefined) {
      // [throw, val]
      sb.emitPushInt(node, constants.THROW_COMPLETION);
      // [finally, throw, val]
      sb.emitPushInt(node, constants.FINALLY_COMPLETION);
      sb.emitJmp(node, 'JMP_L', finallyPC);
    } else if (ts.isSourceFile(node) || (parent !== undefined && ts.isSourceFile(parent))) {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            sb.emitHelper(node, options, sb.helpers.invocationIsCaller);
          },
          whenTrue: () => {
            sb.emitOp(node, 'ABORT');
          },
          whenFalse: () => {
            sb.emitPushBoolean(node, false);
            sb.emitPushInt(node, constants.NORMAL_COMPLETION);
            sb.emitOp(node, 'RET');
          },
        }),
      );
    } else {
      sb.emitPushInt(node, constants.THROW_COMPLETION);
      sb.emitOp(node, 'RET');
    }
  }
}
