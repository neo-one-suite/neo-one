import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [objectVal]
export class CreateBufferHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [Buffer]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Buffer' }));
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.new({ noArgs: true }));
    }
  }
}
