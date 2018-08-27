import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [arr]
// Output: [arr]
export class ArrCloneHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }
    // [array]
    sb.emitOp(node, 'UNPACK');
    // [...array]
    sb.emitOp(node, 'PACK');
  }
}
