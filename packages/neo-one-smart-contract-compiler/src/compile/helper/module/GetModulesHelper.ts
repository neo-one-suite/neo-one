import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalGlobalProperties } from '../global';
import { Helper } from '../Helper';

// Input: [globalObjectVal]
// Output: [modules]
export class GetModulesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // ['modules', globalObjectVal]
      sb.emitPushString(node, InternalGlobalProperties.MODULES);
      // [modules]
      sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    }
  }
}
