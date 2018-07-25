import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalGlobalProperties } from '../global';
import { Helper } from '../Helper';

// Input: [globalObjectVal]
// Output: [modules]
export class GetModulesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // ['modules', globalObjectVal]
      sb.emitPushString(node, InternalGlobalProperties.Modules);
      // [modules]
      sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
    }
  }
}
