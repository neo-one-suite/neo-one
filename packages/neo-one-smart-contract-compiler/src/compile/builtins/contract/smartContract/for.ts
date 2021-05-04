import { CallFlags } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { Name } from '../../../scope';
import { VisitOptions } from '../../../types';
import { MemberLikeExpression } from '../../types';
import { SmartContractForBase } from '../SmartContractForBase';

// tslint:disable-next-line export-name
export class SmartContractFor extends SmartContractForBase {
  protected emitInitial(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    addressName: Name,
    options: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    // [bufferVal]
    sb.visit(arg, options);
    // []
    sb.scope.set(sb, arg, options, addressName);
  }

  protected emitInvoke(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    prop: ts.Declaration,
    addressName: Name,
    options: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    const scriptHash = sb.context.analysis.extractLiteralAddress(arg);
    // TODO: remove this and change how we call smart contracts, including our own
    // [params, string]
    sb.emitOp(node, 'SWAP');
    // [size, ...params, string]
    sb.emitOp(node, 'UNPACK');
    // [size, size, ...params, string]
    sb.emitOp(node, 'DUP');
    // [size + 1, size, ...params, string]
    sb.emitOp(node, 'INC');
    // [string, size, ...params, string]
    sb.emitOp(node, 'PICK');
    // [size, string, ...params, string]
    sb.emitOp(node, 'SWAP');
    // [size + 1, string, ...params, string]
    sb.emitOp(node, 'INC');
    // [params, string]
    sb.emitOp(node, 'PACK');
    // [string, params]
    sb.emitOp(node, 'SWAP');
    if (scriptHash === undefined) {
      // [bufferVal, string, params]
      sb.scope.get(sb, arg, options, addressName);
      // [number, bufferVal, string, params]
      sb.emitPushInt(node, CallFlags.All);
      // [string, bufferVal, number, params]
      sb.emitOp(node, 'REVERSE3');
      // [bufferVal, string, number, params]
      sb.emitOp(node, 'SWAP');
      // [buffer, string, number, params]
      sb.emitHelper(prop, options, sb.helpers.unwrapBuffer);
      // [result]
      sb.emitSysCall(node, 'System.Contract.Call');
    } else {
      // [buffer, string, params]
      sb.emitPushBuffer(prop, scriptHash);
      // [number, buffer, string, params]
      sb.emitPushInt(node, CallFlags.All);
      // [string, buffer, number, params]
      sb.emitOp(node, 'REVERSE3');
      // [buffer, string, number, params]
      sb.emitOp(node, 'SWAP');
      // [result]
      sb.emitSysCall(node, 'System.Contract.Call');
    }
  }
}
