import { getSysCallHash, Op } from '@neo-one/client-common';
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
    // [7, transaction]
    sb.emitPushInt(node, 7);
    // [buffer]
    sb.emitOp(node, 'PICKITEM');
    // [buffer, buffer]
    sb.emitOp(node, 'DUP');
    // [25, buffer, buffer]
    sb.emitPushInt(node, 25);
    // [25, buffer, 25, buffer]
    sb.emitOp(node, 'TUCK');
    // [appCallHash, 25, buffer]
    sb.emitOp(node, 'RIGHT');
    // [appCall, appCallHash, 25, buffer]
    sb.emitPushBuffer(node, Buffer.concat([Buffer.from([Op.SYSCALL]), getSysCallHash('System.Contract.Call')]));
    // [hash, appCall, appCallHash, 25, buffer]
    sb.emitSysCall(node, 'System.Runtime.GetExecutingScriptHash');
    // [appCallHash, appCallHash, 25, buffer]
    sb.emitOp(node, 'CAT');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, 25, buffer]
          sb.emitOp(node, 'EQUAL');
        },
        whenTrue: () => {
          // [buffer, 25, buffer]
          sb.emitOp(node, 'OVER');
          // [size, 25, buffer]
          sb.emitOp(node, 'SIZE');
          // [25, size, buffer]
          sb.emitOp(node, 'SWAP');
          // [size - 25, buffer]
          sb.emitOp(node, 'SUB');
          // [argsBuffer]
          sb.emitOp(node, 'LEFT');
          // [argsHash]
          sb.emitHelper(node, options, sb.helpers.SHA256);
          // [argsHash]
          sb.emitHelper(node, options, sb.helpers.RIPEMD160);
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
