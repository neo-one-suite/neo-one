import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class ShouldSkipVerify extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [buffer]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetCallingScriptHash');
    // [buffer, buffer]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetEntryScriptHash');
    // [boolean]
    sb.emitOp(node, 'EQUAL');
    // [transaction, boolean]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [references, boolean]
    sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
    // [boolean, boolean]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrSome({
        map: () => {
          // [inputScriptHash]
          sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
          // [scriptHash, inputScriptHash]
          sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
      }),
    );
    // [boolean]
    sb.emitOp(node, 'BOOLOR');
    // [boolean]
    sb.emitOp(node, 'NOT');
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.wrapBoolean);
  }
}
