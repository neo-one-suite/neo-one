import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [objectVal]
export class CreateMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [Map]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Map' }));
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.new({ noArgs: true }));
    }
  }
}
