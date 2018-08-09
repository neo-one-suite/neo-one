import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferConcat extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    // [arrayVal]
    sb.visit(arg, options);
    // [arr]
    sb.emitHelper(arg, options, sb.helpers.unwrapArray);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.concatBuffer);
    if (optionsIn.pushValue) {
      // [bufferVal]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
