import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class SetAdd extends BuiltinInstanceMemberCall {
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

    if (optionsIn.pushValue) {
      // [val, val]
      sb.emitOp(node, 'DUP');
    }
    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapMap);
    // [valVal, map]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [key, map]
    sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    // [value, keyVal, map]
    sb.emitPushBoolean(node, true);
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
