import { UInt160 } from '@neo-one/client-common';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberValue } from '../BuiltinMemberValue';
import { MemberLikeExpression } from '../types';

export class BlockchainCurrentTransfers extends BuiltinMemberValue {
  public constructor(private readonly hash: UInt160) {
    super();
  }
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (options.pushValue) {
      // [buffer]
      sb.emitPushBuffer(node, this.hash);
      // [notifications]
      sb.emitSysCall(node, 'System.Runtime.GetNotifications');
      // [transfers]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrFilter({
          map: () => {
            // [size, scriptHash, name, state]
            sb.emitOp(node, 'UNPACK');
            // [scriptHash, name, state]
            sb.emitOp(node, 'DROP');
            // [name, state]
            sb.emitOp(node, 'DROP');
            // [name]
            sb.emitOp(node, 'NIP');
            // ["Transfer", name]
            sb.emitPushString(node, 'Transfer');
            // [boolean]
            sb.emitOp(node, 'EQUAL');
          },
        }),
      );
      // [transfers]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrMap({
          // [[scriptHash, name, [from, to, amount]]]
          map: () => {
            // [size, scriptHash, name, [from, to, amount]]
            sb.emitOp(node, 'UNPACK');
            // [scriptHash, name, [from, to, amount]]
            sb.emitOp(node, 'DROP');
            // [scriptHash, [from, to, amount]]
            sb.emitOp(node, 'NIP');
            // [scriptHash, [from, to, amount]]
            sb.emitHelper(node, options, sb.helpers.wrapBuffer);
            // [[from, to, amount], scriptHash]
            sb.emitOp(node, 'SWAP');
            // [size, from, to, amount, scriptHash]
            sb.emitOp(node, 'UNPACK');
            // [from, to, amount, scriptHash]
            sb.emitOp(node, 'DROP');
            // [from, to, amount, scriptHash]
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [from, from, to, amount, scriptHash]
                  sb.emitOp(node, 'DUP');
                  // [isNull, from, to, amount, scriptHash]
                  sb.emitOp(node, 'ISNULL');
                },
                whenTrue: () => {
                  // [to, amount, scriptHash]
                  sb.emitOp(node, 'DROP');
                  // [from, to, amount, scriptHash]
                  sb.emitHelper(node, options, sb.helpers.wrapUndefined);
                },
                whenFalse: () => {
                  // [from, to, amount, scriptHash]
                  sb.emitHelper(node, options, sb.helpers.wrapBuffer);
                },
              }),
            );
            // [amount, from, to, scriptHash]
            sb.emitOp(node, 'ROT');
            // [amount, from, to, scriptHash]
            sb.emitHelper(node, options, sb.helpers.wrapNumber);
            // [to, amount, from, scriptHash]
            sb.emitOp(node, 'ROT');
            // [to, amount, from, scriptHash]
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [to, to, amount, from, scriptHash]
                  sb.emitOp(node, 'DUP');
                  // [isNull, to, amount, from, scriptHash]
                  sb.emitOp(node, 'ISNULL');
                },
                whenTrue: () => {
                  // [amount, from, scriptHash]
                  sb.emitOp(node, 'DROP');
                  // [to, amount, from, scriptHash]
                  sb.emitHelper(node, options, sb.helpers.wrapUndefined);
                },
                whenFalse: () => {
                  // [to, amount, from, scriptHash]
                  sb.emitHelper(node, options, sb.helpers.wrapBuffer);
                },
              }),
            );
            // [size, from, to, amount, scriptHash]
            sb.emitPushInt(node, 4);
            // [[from, to, amount, scriptHash]]
            sb.emitOp(node, 'PACK');
            // [transfer]
            sb.emitHelper(node, options, sb.helpers.wrapTransfer);
          },
        }),
      );
      // [transfersArr]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    }
  }
}
