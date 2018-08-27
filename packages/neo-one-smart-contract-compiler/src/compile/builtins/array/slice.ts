import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArraySlice extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, node: ts.CallExpression): boolean {
    return tsUtils.argumented.getArguments(node).length <= 2;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    const expr = tsUtils.expression.getExpression(func);
    if (!visited) {
      // [arrayVal]
      sb.visit(expr, options);
    }

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    const args = tsUtils.argumented.getArguments(node);
    if (args.length === 0) {
      sb.emitHelper(node, options, sb.helpers.arrClone);
    } else if (args.length === 1) {
      // [val, arr]
      sb.visit(args[0], options);
      // [number, arr]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.arrSlice());
    } else {
      // [endVal, arr]
      sb.visit(args[1], options);
      // [end, arr]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [startVal, end, arr]
      sb.visit(args[0], options);
      // [start, end, arr]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.arrSlice({ hasEnd: true }));
    }

    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
