import { common } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [argsBuffer]
// Output: [argsHash]
export class RIPEMD160Helper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [1, argsBuffer]
    sb.emitPushInt(node, 1);
    // [[argsBuffer]]
    sb.emitOp(node, 'PACK');
    // ['ripemd160', [argsBuffer]]
    sb.emitPushString(node, 'ripemd160');
    // [buffer, 'ripemd160', [argsBuffer]]
    sb.emitPushBuffer(node, common.nativeHashes.CryptoLib);
    // [argsHash]
    sb.emitSysCall(node, 'System.Contract.Call');
  }
}
