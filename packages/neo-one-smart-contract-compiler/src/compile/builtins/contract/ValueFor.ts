import { SysCallName } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ValueFor extends BuiltinMemberCall {
  public constructor(
    private readonly syscall: SysCallName,
    private readonly wrap: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void,
  ) {
    super();
  }
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [bufferVal]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    if (optionsIn.pushValue) {
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
      // [account]
      sb.emitSysCall(node, this.syscall);
      // [val]
      this.wrap(sb, node, options);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
