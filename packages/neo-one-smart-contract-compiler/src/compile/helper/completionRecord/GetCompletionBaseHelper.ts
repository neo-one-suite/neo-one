import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [completion]
// Output: [val]
export abstract class GetCompletionBaseHelper extends Helper {
  protected abstract readonly index: number;

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [index, completion]
    sb.emitPushInt(node, this.index);
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
