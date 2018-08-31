import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayReduce extends BuiltinInstanceMemberCall {
  protected readonly isReadonly = false;

  public canCall(_sb: ScriptBuilder, _func: MemberLikeExpression, node: ts.CallExpression): boolean {
    return ts.isCallExpression(node) && tsUtils.argumented.getArguments(node).length === 2;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    if (!visited && (ts.isPropertyAccessExpression(func) || ts.isElementAccessExpression(func))) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    if (tsUtils.argumented.getArguments(node).length < 2) {
      /* istanbul ignore next */
      return;
    }

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [val, arr]
    sb.visit(tsUtils.argumented.getArguments(node)[1], options);
    // [objectVal, val, arr]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [val]
    sb.emitHelper(node, options, sb.helpers.arrReduceFunc);
    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
