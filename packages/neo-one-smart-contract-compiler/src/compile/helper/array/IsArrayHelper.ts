import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [boolean]
export class IsArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [Array, val]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Array' }));
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.instanceof);
    }
  }
}
