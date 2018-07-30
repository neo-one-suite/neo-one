import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalMapProperties } from './InternalMapProperties';

// Input: [objectVal]
// Output: [arr]
export class GetMapValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // ['DataMap', objectVal]
    sb.emitPushString(node, InternalMapProperties.DATA_MAP);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  }
}
