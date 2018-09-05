import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class IsValidSendHelper extends Helper {
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
    sb.emitHelper(node, optionsIn, sb.helpers.isValidAssetValueMapForSend);
  }
}
