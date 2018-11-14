import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class SetProcessedTransactionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createStructuredStorage({
        prefix: ContractPropertyName.processedTransactions,
        type: Types.SetStorage,
      }),
    );
    // [transaction, val]
    sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
    // [hash, val]
    sb.emitSysCall(node, 'Neo.Transaction.GetHash');
    // [hashVal, val]
    sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    // [boolean, hashVal, val]
    sb.emitPushBoolean(node, true);
    // [val, hashVal, val]
    sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.setStructuredStorage({
        type: Types.SetStorage,
        keyType: undefined,
        knownKeyType: Types.Buffer,
      }),
    );
  }
}
