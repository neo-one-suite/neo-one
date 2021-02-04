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
    sb.emitHelper(node, options, sb.helpers.genericLogSerialize);
    // [buffer]
    sb.emitSysCall(node, 'System.Binary.Serialize');
    // [line, buffer]
    sb.emitLine(node);
    // ['console.log', line, buffer]
    sb.emitPushString(node, 'console.log');
    // [length, 'console.log', line, buffer]
    sb.emitPushInt(node, 3);
    // [arr]
    sb.emitOp(node, 'PACK');
    // ['console.log', arr]
    sb.emitPushString(node, 'console.log');
    // []
    sb.emitSysCall(node, 'System.Runtime.Notify');
  }
}
