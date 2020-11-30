import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class CompleteSendHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [transaction]
    sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
    // [inputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetInputs');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [inputs, inputs]
          sb.emitOp(node, 'DUP');
          // [size, inputs]
          sb.emitOp(node, 'SIZE');
          // [0, size, inputs]
          sb.emitPushInt(node, 0);
          // [size == 0, inputs]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
        whenFalse: () => {
          // [0, inputs]
          sb.emitPushInt(node, 0);
          // [input]
          sb.emitOp(node, 'PICKITEM');
          // [input, input]
          sb.emitOp(node, 'DUP');
          // [number, input]
          sb.emitSysCall(node, 'Neo.Input.GetIndex');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [0, number, input]
                sb.emitPushInt(node, 0);
                // [number == 0, input]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                // [hash]
                sb.emitSysCall(node, 'Neo.Input.GetHash');
                // [val, hash]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.createStructuredStorage({
                    prefix: ContractPropertyName.claimedTransactions,
                    type: Types.MapStorage,
                  }),
                );
                // [hash, val]
                sb.emitOp(node, 'SWAP');
                // [hashVal, val]
                sb.emitHelper(node, options, sb.helpers.wrapBuffer);
                // [val]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.getStructuredStorage({
                    type: Types.MapStorage,
                    keyType: undefined,
                    knownKeyType: Types.Buffer,
                  }),
                );
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.if({
                    condition: () => {
                      // [val, val]
                      sb.emitOp(node, 'DUP');
                      // [boolean, val]
                      sb.emitHelper(node, options, sb.helpers.isUndefined);
                    },
                    whenTrue: () => {
                      // []
                      sb.emitOp(node, 'DROP');
                      // [boolean]
                      sb.emitPushBoolean(node, false);
                    },
                    whenFalse: () => {
                      // [buffer]
                      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
                      // [boolean]
                      sb.emitHelper(node, options, sb.helpers.isCaller);
                      // [transaction, boolean]
                      sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
                      // [references, boolean]
                      sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
                      // [references, boolean]
                      sb.emitHelper(
                        node,
                        options,
                        sb.helpers.arrFilter({
                          map: () => {
                            // [buffer]
                            sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                            // [buffer, buffer]
                            sb.emitSysCall(node, 'System.Runtime.GetExecutingScriptHash');
                            // [boolean]
                            sb.emitOp(node, 'EQUAL');
                          },
                        }),
                      );
                      // [size, boolean]
                      sb.emitOp(node, 'SIZE');
                      // [1, size, boolean]
                      sb.emitPushInt(node, 1);
                      // [size == 1, boolean]
                      sb.emitOp(node, 'NUMEQUAL');
                      // [boolean]
                      sb.emitOp(node, 'BOOLAND');
                    },
                  }),
                );
              },
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
  }
}
