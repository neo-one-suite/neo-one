import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [struct]
// Output: [struct]
export class CloneStructHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [size, val1, val2]
    sb.emitOp(node, 'UNPACK');
    // [struct, val1, val2]
    sb.emitOp(node, 'NEWSTRUCT');
    // [struct, val1, struct, val2]
    sb.emitOp(node, 'TUCK');
    // [0, struct, val1, struct, val2]
    sb.emitPushInt(node, 0);
    // [val1, 0, struct, struct, val2]
    sb.emitOp(node, 'ROT');
    // [struct, val2]
    sb.emitOp(node, 'SETITEM');
    // [struct, val2, struct]
    sb.emitOp(node, 'TUCK');
    // [1, struct, val2, struct]
    sb.emitPushInt(node, 1);
    // [val2, 1, struct, struct]
    sb.emitOp(node, 'ROT');
    // [struct]
    sb.emitOp(node, 'SETITEM');
  }
}
