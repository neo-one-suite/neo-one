import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { GlobalProperty } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class AddressIsSender extends BuiltinMemberCall {
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
    // [buffer]
    sb.emitHelper(tsUtils.argumented.getArguments(node)[0], options, sb.helpers.unwrapBuffer);
    // [buffer, buffer]
    sb.emitOp(node, 'DUP');
    // [boolean, buffer]
    sb.emitSysCall(node, 'Neo.Runtime.CheckWitness');
    // [buffer, boolean]
    sb.emitOp(node, 'SWAP');
    // [buffer, buffer, boolean]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CallingScriptHash }));
    // [boolean, boolean]
    sb.emitOp(node, 'EQUAL');
    // [boolean]
    sb.emitOp(node, 'BOOLOR');

    if (optionsIn.pushValue) {
      // [booleanVal]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
