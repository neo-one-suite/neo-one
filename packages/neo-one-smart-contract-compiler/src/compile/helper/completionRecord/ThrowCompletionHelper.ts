import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [errorVal]
// Output: []
export class ThrowCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number]
    sb.emitLine(node);
    // ['trace', number]
    sb.emitPushString(node, 'trace');
    // [2, 'trace', number]
    sb.emitPushInt(node, 2);
    // [array]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitSysCall(node, 'Neo.Runtime.Notify');
    // []
    sb.emitHelper(node, options, sb.helpers.throwCompletionBase);
  }
}
