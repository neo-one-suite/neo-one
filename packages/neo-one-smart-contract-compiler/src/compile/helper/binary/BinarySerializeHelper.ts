import { CallFlags, common } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [buffer]
export class BinarySerializeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [1, val]
    sb.emitPushInt(node, 1);
    // [[val]]
    sb.emitOp(node, 'PACK');
    // [number, [val]]
    sb.emitPushInt(node, CallFlags.None);
    // ['serialize', number, [val]]
    sb.emitPushString(node, 'serialize');
    // [buffer, 'serialize', number, [val]]
    sb.emitPushBuffer(node, common.nativeHashes.StdLib);
    // [buffer]
    sb.emitSysCall(node, 'System.Contract.Call');
  }
}
