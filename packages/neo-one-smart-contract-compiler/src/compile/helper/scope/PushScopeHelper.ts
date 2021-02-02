import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// effectively replaces TOALTSTACK

// Input: [scope]
// Output: []
export class PushScopeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [arr, scope]
    sb.emitOp(node, 'LDSFLD0');
    // [scope, arr]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitOp(node, 'APPEND');
  }
}
