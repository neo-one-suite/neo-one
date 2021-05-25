import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [iterator]
// Output: [key]
export class GetMapIteratorKeyHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [[key, value]]
    sb.emitSysCall(node, 'System.Iterator.Value');
    // [0, [key, value]]
    sb.emitPushInt(node, 0);
    // [key]
    sb.emitOp(node, 'PICKITEM');
    // [key]
    sb.emitHelper(node, options, sb.helpers.deserializeIteratorKey);
  }
}
