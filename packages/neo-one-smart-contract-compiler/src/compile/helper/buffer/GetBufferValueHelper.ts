import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalBufferProperties } from './InternalBufferProperties';

// Input: [objectVal]
// Output: [byteArray]
export class GetBufferValueHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['data', objectVal]
    sb.emitPushString(node, InternalBufferProperties.Data);
    // [byteArray]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  }
}
