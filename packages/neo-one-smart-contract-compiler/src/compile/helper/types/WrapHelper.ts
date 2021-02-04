import ts from 'typescript';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [value] or []
// Output: [val]
export abstract class WrapHelper extends Helper {
  protected readonly length: number = 2;
  protected abstract readonly type: Types;

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [type, value]
    sb.emitPushInt(node, this.type);
    // [0, type, value]
    sb.emitPushInt(node, 0);
    // [2, 0, type, value]
    sb.emitPushInt(node, this.length);
    // [struct, 0, type, value]
    sb.emitOp(node, 'NEWSTRUCT');
    // [struct, struct, 0, type, value]
    sb.emitOp(node, 'DUP');
    // [type, 0, struct, struct, value]
    sb.emitOp(node, 'REVERSE4');
    // [[type, null], value]
    sb.emitOp(node, 'SETITEM');
    if (this.length !== 1) {
      // [[type, null], value, [type, null]]
      sb.emitOp(node, 'TUCK');
      // [value, [type, null], [type, null]]
      sb.emitOp(node, 'SWAP');
      // [1, value, [type, null], [type, null]]
      sb.emitPushInt(node, 1);
      // [value, 1, [type, null], [type, null]]
      sb.emitOp(node, 'SWAP');
      // [[type, value]]
      sb.emitOp(node, 'SETITEM');
    }
  }
}
