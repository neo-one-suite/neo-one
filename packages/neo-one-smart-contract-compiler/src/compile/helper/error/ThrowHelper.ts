import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [errorVal]
// Output: []
export class ThrowHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [throwCompletion]
    sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createThrowCompletion);
    // []
    sb.emitHelper(node, options, sb.helpers.handleCompletion);
  }
}
