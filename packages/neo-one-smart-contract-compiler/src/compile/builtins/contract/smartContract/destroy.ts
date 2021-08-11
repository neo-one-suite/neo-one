import { CallFlags, common } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberCall } from '../../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class SmartContractDestroy extends BuiltinInstanceMemberCall {
  public canCall(_sb: ScriptBuilder, _func: CallMemberLikeExpression, node: ts.CallExpression): boolean {
    return tsUtils.argumented.getArguments(node).length === 0;
  }

  public emitCall(
    sb: ScriptBuilder,
    _func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    // [1, buffer]
    sb.emitPushInt(node, 1);
    // [[buffer]]
    sb.emitOp(node, 'PACK');
    // [number, [buffer]]
    sb.emitPushInt(node, CallFlags.All);
    // ['destroy', number, [buffer]]
    sb.emitPushString(node, 'destroy');
    // [buffer, 'destroy', number, [buffer]]
    sb.emitPushBuffer(node, common.nativeHashes.ContractManagement);
    // [conract]
    sb.emitSysCall(node, 'System.Contract.Call');
    sb.addMethodToken(common.nativeHashes.ContractManagement, 'destroy', 1, false, CallFlags.All);

    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, optionsIn, sb.helpers.wrapUndefined);
    }
  }
}
