import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [globalObjectVal]
// Output: [modules]
export class GetModulesHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (options.pushValue) {
      // ['modules', globalObjectVal]
      sb.emitPushInt(node, GlobalProperty.Modules);
      // [modules]
      sb.emitOp(node, 'PICKITEM');
    }
  }
}
