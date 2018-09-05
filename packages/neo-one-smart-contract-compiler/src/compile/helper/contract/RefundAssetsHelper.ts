import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class RefundAssetsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number]
    sb.emitPushInt(node, 1);
    // [argsarr]
    sb.emitHelper(node, options, sb.helpers.getArgument);
    // [0, argsarr]
    sb.emitPushInt(node, 0);
    // [buffer]
    sb.emitOp(node, 'PICKITEM');
    // [buffer, buffer]
    sb.emitOp(node, 'DUP');
    // [isProcessedTransaction, buffer]
    sb.emitHelper(node, options, sb.helpers.isProcessedTransaction);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [!isProcessedTransaction, buffer]
          sb.emitOp(node, 'NOT');
        },
        whenTrue: () => {
          // [transaction]
          sb.emitSysCall(node, 'Neo.Blockchain.GetTransaction');
          // [transaction, transaction]
          sb.emitOp(node, 'DUP');
          // [references, transaction]
          sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [boolean, transaction]
                sb.emitHelper(
                  node,
                  options,
                  sb.helpers.arrSome({
                    map: () => {
                      // [buffer]
                      sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                      // [isCaller]
                      sb.emitHelper(node, options, sb.helpers.isCaller);
                      // [!isCaller]
                      sb.emitOp(node, 'NOT');
                    },
                  }),
                );
              },
              whenTrue: () => {
                // []
                sb.emitOp(node, 'DROP');
                // [boolean]
                sb.emitPushBoolean(node, false);
              },
              whenFalse: () => {
                // [outputs]
                sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
                // [map]
                sb.emitHelper(node, options, sb.helpers.getOutputAssetValueMap);
                // [transaction, map]
                sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
                // [references, map]
                sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
                // [map]
                sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: false }));
                // [transaction, map]
                sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
                // [outputs, map]
                sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
                // [map]
                sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: true }));
                // Sum of value to be refunded - sum of value taken from contract + sum of value returned to contract as change must equal 0
                // [boolean]
                sb.emitHelper(node, options, sb.helpers.isValidAssetValueMapForRefund);
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

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
