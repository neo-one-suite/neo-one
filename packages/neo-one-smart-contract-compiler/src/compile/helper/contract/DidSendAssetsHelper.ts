import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class DidSendAssetsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [transaction]
    sb.emitSysCall(node, 'System.Runtime.GetScriptContainer');
    // [outputs]
    sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
    // [boolean]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrSome({
        map: () => {
          // [hash]
          sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
          // [hash, hash]
          sb.emitSysCall(node, 'System.Runtime.GetExecutingScriptHash');
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
