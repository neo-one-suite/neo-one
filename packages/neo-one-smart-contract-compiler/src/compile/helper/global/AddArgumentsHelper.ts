import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalGlobalProperties } from './InternalGlobalProperties';

// Input: [argv, globalObjectVal]
// Output: []
export class AddArgumentsHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // ['arguments', argv, globalObjectVal]
    sb.emitPushString(node, InternalGlobalProperties.Arguments);
    // [argv, 'arguments', globalObjectVal]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
