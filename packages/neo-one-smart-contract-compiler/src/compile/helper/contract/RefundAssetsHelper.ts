import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class RefundAssetsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const references = sb.scope.addUnique();

    // [transaction]
    sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
    // [references]
    sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
    // []
    sb.scope.set(sb, node, options, references);
    // [transaction]
    sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
    // [inputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetInputs');
    // [map, inputs]
    sb.emitOp(node, 'NEWMAP');
    // [map]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduce({
        withIndex: true,
        each: (innerOptions) => {
          // [idx, map, input]
          sb.emitOp(node, 'ROT');
          // [references, idx, map, input]
          sb.scope.get(sb, node, innerOptions, references);
          // [idx, references, map, input]
          sb.emitOp(node, 'SWAP');
          // [reference, map, input]
          sb.emitOp(node, 'PICKITEM');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [buffer, map, input]
                sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                // [buffer, buffer, map, input]
                sb.emitSysCall(node, 'System.Runtime.GetExecutingScriptHash');
                // [boolean, map, input]
                sb.emitOp(node, 'EQUAL');
              },
              whenTrue: () => {
                // [map, input, map]
                sb.emitOp(node, 'TUCK');
                // [input, map, map]
                sb.emitOp(node, 'SWAP');
                // [hash, map, map]
                sb.emitSysCall(node, 'Neo.Input.GetHash');
                // [boolean, hash, map, map]
                sb.emitPushBoolean(node, true);
                // [map]
                sb.emitOp(node, 'SETITEM');
              },
              whenFalse: () => {
                // [map]
                sb.emitOp(node, 'NIP');
              },
            }),
          );
        },
      }),
    );
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [map, map]
          sb.emitOp(node, 'DUP');
          // [size, map]
          sb.emitOp(node, 'SIZE');
          // [1, size, map]
          sb.emitPushInt(node, 1);
          // [size === 1, map]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [arr]
          sb.emitOp(node, 'KEYS');
          // [0, arr]
          sb.emitPushInt(node, 0);
          // [buffer]
          sb.emitOp(node, 'PICKITEM');
          // [buffer, buffer]
          sb.emitOp(node, 'DUP');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [isProcessedTransaction, buffer]
                sb.emitHelper(node, options, sb.helpers.isProcessedTransaction);
              },
              whenTrue: () => {
                // []
                sb.emitOp(node, 'DROP');
                // [boolean]
                sb.emitPushBoolean(node, false);
              },
              whenFalse: () => {
                // [transaction]
                sb.emitSysCall(node, 'Neo.Blockchain.GetTransaction');
                // [references]
                sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
                // [boolean]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.arrEvery({
                    map: () => {
                      // [buffer]
                      sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                      // [isCaller]
                      sb.emitHelper(node, options, sb.helpers.isCaller);
                    },
                  }),
                );
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

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // do nothing
        },
        whenFalse: () => {
          // ['InvalidRefundAssetsError']
          sb.emitPushString(node, 'InvalidRefundAssetsError');
          // [value]
          sb.emitHelper(node, options, sb.helpers.wrapString);
          // []
          sb.emitHelper(node, options, sb.helpers.throw);
        },
      }),
    );

    if (optionsIn.pushValue) {
      sb.emitHelper(node, options, sb.helpers.wrapUndefined);
    }
  }
}
