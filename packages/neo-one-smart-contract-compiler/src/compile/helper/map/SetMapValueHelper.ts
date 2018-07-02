import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalMapProperties } from './InternalMapProperties';

// Input: [arr, objectVal]
// Output: []
export class SetMapValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // ['DataMap', arr, objectVal]
    sb.emitPushString(node, InternalMapProperties.DATA_MAP);
    // [arr, 'DataMap', objectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
