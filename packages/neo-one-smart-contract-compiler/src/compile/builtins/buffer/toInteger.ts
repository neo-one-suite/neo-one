import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferToInteger extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, _node: ts.CallExpression): boolean {
    return true;
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
      // [bufferVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    if (optionsIn.pushValue) {
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
