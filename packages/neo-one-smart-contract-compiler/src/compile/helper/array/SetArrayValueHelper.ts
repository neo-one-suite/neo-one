import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalArrayProperties } from './InternalArrayProperties';

// Input: [arr, objectVal]
// Output: []
export class SetArrayValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // ['DataArray', arr, objectVal]
    sb.emitPushString(node, InternalArrayProperties.DATA_ARRAY);
    // [arr, 'DataArray', objectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
