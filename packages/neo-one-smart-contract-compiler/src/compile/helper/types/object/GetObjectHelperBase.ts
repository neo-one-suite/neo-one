import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [objectVal]
// Output: [obj]
export abstract class GetObjectHelperBase extends Helper<Node> {
  protected abstract index: number;

  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [object]
    sb.emitHelper(node, options, sb.helpers.getObject);
    // [2, object]
    sb.emitPushInt(node, this.index);
    // [obj]
    sb.emitOp(node, 'PICKITEM');
  }
}
