import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [errorVal]
// Output: [completion]
export class CreateThrowCompletionHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [undefinedVal, errorVal]
    sb.emitHelper(node, options, sb.helpers.createUndefined);
    // [completion]
    sb.emitHelper(node, options, sb.helpers.createCompletion);
  }
}
