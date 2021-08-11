import { CallFlags, common } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [argsBuffer]
// Output: [argsHash]
export class SHA256Helper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [1, argsBuffer]
    sb.emitPushInt(node, 1);
    // [[argsBuffer]]
    sb.emitOp(node, 'PACK');
    // [number, [argsBuffer]]
    sb.emitPushInt(node, CallFlags.None);
    // ['sha256', number, [argsBuffer]]
    sb.emitPushString(node, 'sha256');
    // [buffer, 'ripemd160', number, [argsBuffer]]
    sb.emitPushBuffer(node, common.nativeHashes.CryptoLib);
    // [argsHash]
    sb.emitSysCall(node, 'System.Contract.Call');
    sb.addMethodToken(common.nativeHashes.CryptoLib, 'sha256', 1, true, CallFlags.None);
  }
}
