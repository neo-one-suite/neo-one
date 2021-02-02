import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// effectively replaces DUPFROMALTSTACK

// Input: []
// Output: [scope]
export class DupScopeHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [arr]
    sb.emitOp(node, 'LDSFLD0');
    // [arr, arr]
    sb.emitOp(node, 'DUP');
    // [size, arr]
    sb.emitOp(node, 'SIZE');
    // [size - 1, arr]
    sb.emitOp(node, 'DEC');
    // [scope]
    sb.emitOp(node, 'PICKITEM');
  }
}
