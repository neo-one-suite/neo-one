import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { MemberLikeExpression } from '../../types';
import { SmartContractForBase } from '../SmartContractForBase';

// tslint:disable-next-line export-name
export class SmartContractFor extends SmartContractForBase {
  protected emitInvoke(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    prop: ts.Declaration,
    callBuffer: Buffer,
    options: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    const scriptHash = sb.context.analysis.extractLiteralAddress(arg);
    if (scriptHash === undefined) {
      // [bufferVal, string, params]
      sb.visit(arg, options);
      // [buffer, string, params]
      sb.emitHelper(prop, options, sb.helpers.unwrapBuffer);
      // [result]
      sb.emitOp(prop, 'CALL_ED', callBuffer);
    } else {
      // [result]
      sb.emitOp(prop, 'CALL_E', Buffer.concat([callBuffer, scriptHash]));
    }
  }
}
