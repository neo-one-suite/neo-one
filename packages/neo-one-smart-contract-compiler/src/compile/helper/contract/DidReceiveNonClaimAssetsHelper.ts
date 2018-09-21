import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class DidReceiveNonClaimAssetsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [transaction]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [claims]
    sb.emitSysCall(node, 'Neo.ClaimTransaction.GetClaimReferences');
    // [map];
    sb.emitHelper(node, options, sb.helpers.getOutputAssetValueMap);
    // [transaction, map]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [map, map]
    sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
    // [map]
    sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: false }));
    // [boolean]
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.mapSome({
        each: () => {
          // [value]
          sb.emitOp(node, 'DROP');
          // [0, value]
          sb.emitPushInt(node, 0);
          // [value < 0]
          sb.emitOp(node, 'LT');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
