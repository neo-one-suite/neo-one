import { common } from '@neo-one/client-common';
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
    // [outputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
    // [map]
    sb.emitHelper(node, options, sb.helpers.getOutputAssetValueMap);
    // [transaction, map]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [outputs, map]
    sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
    // [map]
    sb.emitHelper(node, options, sb.helpers.mergeAssetValueMaps({ add: false }));
    // [boolean]
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.mapSome({
        each: () => {
          // [buffer, key, value]
          sb.emitPushBuffer(node, common.stringToUInt256(common.GAS_ASSET_HASH));
          // [isGAS, value]
          sb.emitOp(node, 'EQUAL');
          // [!isGAS, value]
          sb.emitOp(node, 'NOT');
          // [value, !isGAS]
          sb.emitOp(node, 'SWAP');
          // [0, value, !isGAS]
          sb.emitPushInt(node, 0);
          // [value > 0, !isGAS]
          sb.emitOp(node, 'GT');
          // [value > 0 && !isGAS]
          sb.emitOp(node, 'BOOLAND');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
