import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [length, pobj, sobj, iobj, ...]
// Output: [objectVal]
export class PackObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [object]
      sb.emitOp(node, 'PACK');
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.wrapObject);
    }
  }
}
