import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [buffer]
// Output: [boolean]
export class IsCallerHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

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
          sb.emitSysCall(node, 'System.Blockchain.GetContract');
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
              // They are the caller IFF they signed the transaction AND
              // (this is the first contract called OR we are in verification BECAUSE verification already checks that this is the first contract called).
              whenTrue: () => {
                // [boolean]
                sb.emitSysCall(node, 'System.Runtime.CheckWitness');
                // [boolean, boolean]
                sb.emitHelper(node, options, sb.helpers.invocationIsCaller);
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

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
