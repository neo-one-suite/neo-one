import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// effectively replaces FROMALTSTACK

// Input: []
// Output: [scope]
export class PopScopeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [arr]
    sb.emitOp(node, 'LDSFLD0');
    // [scope]
    sb.emitOp(node, 'POPITEM');
  }
}
