import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class AccountGetBalance extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, node: ts.CallExpression): boolean {
    return tsUtils.argumented.getArguments(node).length === 1;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    // [account]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [bufferVal, account]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [buffer, account]
    sb.emitHelper(tsUtils.argumented.getArguments(node)[0], options, sb.helpers.unwrapBuffer);
    // [account, buffer]
    sb.emitOp(node, 'SWAP');
    // [number]
    sb.emitSysCall(node, 'Neo.Account.GetBalance');
    if (optionsIn.pushValue) {
      // [booleanVal]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
