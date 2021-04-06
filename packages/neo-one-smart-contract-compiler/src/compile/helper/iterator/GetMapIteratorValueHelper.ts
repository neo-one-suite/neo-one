import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [iterator]
// Output: [value]
export class GetMapIteratorValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [[key, value]]
    sb.emitSysCall(node, 'System.Iterator.Value');
    // [1, [key, value]]
    sb.emitPushInt(node, 1);
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
