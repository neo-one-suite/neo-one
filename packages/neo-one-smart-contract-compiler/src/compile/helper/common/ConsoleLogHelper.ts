import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [arr]
// Output: []
export class ConsoleLogHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
    // [value]
    sb.emitHelper(node, options, sb.helpers.genericSerialize);
    // [buffer]
    sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    // [line, buffer]
    sb.emitLine(node);
    // ['console.log', line, buffer]
    sb.emitPushString(node, 'console.log');
    // [length, 'console.log', line, buffer]
    sb.emitPushInt(node, 3);
    // [arr]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitSysCall(node, 'Neo.Runtime.Notify');
  }
}
