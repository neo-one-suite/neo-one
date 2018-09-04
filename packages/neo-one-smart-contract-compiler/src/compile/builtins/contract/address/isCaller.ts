import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { GlobalProperty } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class AddressIsCaller extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [bufferVal]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [addressBuffer]
    sb.emitHelper(tsUtils.argumented.getArguments(node)[0], options, sb.helpers.unwrapBuffer);
    // [addressBuffer, addressBuffer]
    sb.emitOp(node, 'DUP');
    // [callingScriptBuffer, addressBuffer, addressBuffer]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CallingScriptHash }));
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, addressBuffer]
          sb.emitOp(node, 'EQUAL');
        },
        // Caller is the address. This happens when the caller is a smart contract.
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, true);
        },
        whenFalse: () => {
          // [addressBuffer, addressBuffer]
          sb.emitOp(node, 'DUP');
          // [maybeContract, addressBuffer]
          sb.emitSysCall(node, 'Neo.Blockchain.GetContract');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [buffer, maybeContract, addressBuffer]
                sb.emitPushBuffer(node, Buffer.alloc(0, 0));
                // [boolean, addressBuffer]
                sb.emitOp(node, 'EQUAL');
              },
              // Address must not be a smart contract.
              // They are the caller IFF they signed the transaction and this is the first contract called.
              whenTrue: () => {
                // [boolean]
                sb.emitSysCall(node, 'Neo.Runtime.CheckWitness');
                // [buffer, boolean]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.getGlobalProperty({ property: GlobalProperty.CallingScriptHash }),
                );
                // [buffer, buffer, boolean]
                sb.emitSysCall(node, 'System.ExecutionEngine.GetEntryScriptHash');
                // [boolean, boolean]
                sb.emitOp(node, 'EQUAL');
                // [boolean]
                sb.emitOp(node, 'BOOLAND');
              },
              // Avoid calling CheckWitness on a contract -> likely to be a recursive loop.
              // Regardless, verifying that native asset transfers are valid should not be conflated with smart contract actions.
              whenFalse: () => {
                // []
                sb.emitOp(node, 'DROP');
                // [boolean]
                sb.emitPushBoolean(node, false);
              },
            }),
          );
        },
      }),
    );

    if (optionsIn.pushValue) {
      // [booleanVal]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
