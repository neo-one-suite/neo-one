import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalGlobalProperties } from './InternalGlobalProperties';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddModulesHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'OVER');
    // ['modules', globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitPushString(node, InternalGlobalProperties.MODULES);
    // [0, 'modules', globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitPushInt(node, 0);
    // [arr, 'modules', globalObjectVal, objectPrototypeVal, globalObjectVal]
    sb.emitOp(node, 'NEWARRAY');
    // [objectPrototypeVal, globalObjectVal]]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }
}
