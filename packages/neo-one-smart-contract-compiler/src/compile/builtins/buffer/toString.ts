import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

const isUTF8 = (node: ts.Node) => ts.isStringLiteral(node) && tsUtils.literal.getLiteralValue(node) === 'utf8';

// tslint:disable-next-line export-name
export class BufferToString extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, node: ts.CallExpression): boolean {
    const arg = tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined;
    if (arg === undefined) {
      /* istanbul ignore next */
      return false;
    }

    return isUTF8(arg);
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
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
      // [stringVal]
      sb.emitHelper(node, options, sb.helpers.wrapString);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
