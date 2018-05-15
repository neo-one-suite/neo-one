import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [globalObjectVal]
// Output: []
export class AddEmptyModuleHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [modules]
    sb.emitHelper(node, options, sb.helpers.getModules);
    // [exports, modules]
    sb.emitOp(node, 'NEWMAP');
    // []
    sb.emitOp(node, 'APPEND');
  }
}
