import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [objectVal]
export class CreateArrayHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [Array]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Array' }));
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.new({ noArgs: true }));
    }
  }
}
