import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class DidReceiveAssetsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [transaction]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [outputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
    // [boolean]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrSome({
        map: () => {
          // [hash]
          sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
          // [hash, hash]
          sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
