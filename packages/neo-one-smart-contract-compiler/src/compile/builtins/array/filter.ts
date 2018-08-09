import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayFilter extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: MemberLikeExpression, node: ts.CallExpression): boolean {
    return ts.isCallExpression(node) && tsUtils.argumented.getArguments(node).length === 1;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
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

    // [arr]
    sb.emitHelper(tsUtils.expression.getExpression(func), options, sb.helpers.unwrapArray);
    // [objectVal, arr]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.arrFilterFunc);
    if (optionsIn.pushValue) {
      // [arrayVal]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
