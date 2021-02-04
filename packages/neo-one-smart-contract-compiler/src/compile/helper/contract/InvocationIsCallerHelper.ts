import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class InvocationIsCallerHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CallingScriptHash }));
    // [buffer, buffer]
    sb.emitSysCall(node, 'System.Runtime.GetEntryScriptHash');
    // [boolean]
    sb.emitOp(node, 'EQUAL');
    // [trigger, boolean]
    sb.emitSysCall(node, 'System.Runtime.GetTrigger');
    // [number, trigger, boolean]
    sb.emitPushInt(node, 0x00);
    // [boolean, boolean]
    sb.emitOp(node, 'NUMEQUAL');
    // [boolean]
    sb.emitOp(node, 'BOOLOR');
  }
}
