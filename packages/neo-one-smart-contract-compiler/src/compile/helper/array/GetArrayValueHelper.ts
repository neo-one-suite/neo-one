import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalArrayProperties } from './InternalArrayProperties';

// Input: [objectVal]
// Output: [arr]
export class GetArrayValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // ['DataArray', objectVal]
    sb.emitPushString(node, InternalArrayProperties.DATA_ARRAY);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  }
}
