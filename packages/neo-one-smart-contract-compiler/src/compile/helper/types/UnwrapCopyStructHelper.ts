import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { UnwrapHelper } from './UnwrapHelper';

// Input: [val]
// Output: [value]
export abstract class UnwrapCopyStructHelper extends UnwrapHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [1, val]
    sb.emitPushInt(node, 1);
    // [value]
    sb.emitOp(node, 'PICKITEM');
    // [value]
    sb.emitOp(node, 'VALUES');
    // [value]
    sb.emitOp(node, 'NEWSTRUCT');
  }
}
