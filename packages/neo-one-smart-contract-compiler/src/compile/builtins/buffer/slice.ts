import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferSlice extends BuiltinInstanceMemberCall {
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
      // [val]
      sb.visit(expr, options);
    }

    // [buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    const args = tsUtils.argumented.getArguments(node);
    if (args.length === 1) {
      // [val, buffer]
      sb.visit(args[0], options);
      // [number, buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.bufferSlice({}));
    } else if (args.length === 2) {
      // [endVal, buffer]
      sb.visit(args[1], options);
      // [end, buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [startVal, end, buffer]
      sb.visit(args[0], options);
      // [start, end, buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.bufferSlice({ hasEnd: true }));
    }

    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
