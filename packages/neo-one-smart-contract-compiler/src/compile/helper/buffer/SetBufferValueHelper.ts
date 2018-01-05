import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalBufferProperties } from './InternalBufferProperties';

// Input: [byteArray, objectVal]
// Output: []
export class SetBufferValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['data', byteArray, objectVal]
    sb.emitPushString(node, InternalBufferProperties.DATA);
    // [byteArray, 'data', objectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
