import { Op } from '@neo-one/client-common';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class ApplicationMatchesVerificationHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [transaction]
    sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
    // [buffer]
    sb.emitSysCall(node, 'Neo.InvocationTransaction.GetScript');
    // [buffer, buffer]
    sb.emitOp(node, 'DUP');
    // [21, buffer, buffer]
    sb.emitPushInt(node, 21);
    // [21, buffer, 21, buffer]
    sb.emitOp(node, 'TUCK');
    // [appCallHash, 21, buffer]
    sb.emitOp(node, 'RIGHT');
    // [appCall, appCallHash, 21, buffer]
    sb.emitPushBuffer(node, Buffer.from([Op.APPCALL]));
    // [hash, appCall, appCallHash, 21, buffer]
    sb.emitSysCall(node, 'System.Runtime.GetExecutingScriptHash');
    // [appCallHash, appCallHash, 21, buffer]
    sb.emitOp(node, 'CAT');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, 21, buffer]
          sb.emitOp(node, 'EQUAL');
        },
        whenTrue: () => {
          // [buffer, 21, buffer]
          sb.emitOp(node, 'OVER');
          // [size, 21, buffer]
          sb.emitOp(node, 'SIZE');
          // [21, size, buffer]
          sb.emitOp(node, 'SWAP');
          // [size - 21, buffer]
          sb.emitOp(node, 'SUB');
          // [argsBuffer]
          sb.emitOp(node, 'LEFT');
          // [argsHash]
          sb.emitOp(node, 'HASH160');
          // [entryHash, argsHash]
          sb.emitSysCall(node, 'System.Runtime.GetEntryScriptHash');
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
        whenFalse: () => {
          // [buffer]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
      }),
    );
  }
}
