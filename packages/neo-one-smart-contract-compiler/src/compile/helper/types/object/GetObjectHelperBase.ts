import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [objectVal]
// Output: [obj]
export abstract class GetObjectHelperBase extends Helper {
  protected abstract readonly index: number;

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
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
