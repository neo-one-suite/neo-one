import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [array]
// Output: [array]
export class CloneArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [array]
    sb.emitOp(node, 'UNPACK');
    // [...array]
    sb.emitOp(node, 'PACK');
  }
}
