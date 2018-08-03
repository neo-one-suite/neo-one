import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: []
// Output: [arrayVal]
export class CreateBufferHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [buffer]
      sb.emitPushBuffer(node, Buffer.from([]));
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }
}
