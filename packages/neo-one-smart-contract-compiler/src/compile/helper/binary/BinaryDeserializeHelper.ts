import { CallFlags, common } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [buffer]
// Output: [val]
export class BinaryDeserializeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [1, buffer]
    sb.emitPushInt(node, 1);
    // [[buffer]]
    sb.emitOp(node, 'PACK');
    // [number, [buffer]]
    sb.emitPushInt(node, CallFlags.None);
    // ['deserialize', number, [buffer]]
    sb.emitPushString(node, 'deserialize');
    // [buffer, 'deserialize', number, [buffer]]
    sb.emitPushBuffer(node, common.nativeHashes.StdLib);
    // [val]
    sb.emitSysCall(node, 'System.Contract.Call');
    sb.addMethodToken(common.nativeHashes.StdLib, 'deserialize', 1, true, CallFlags.None);
  }
}
