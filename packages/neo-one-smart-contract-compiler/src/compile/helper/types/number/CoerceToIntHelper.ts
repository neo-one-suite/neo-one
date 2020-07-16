import ts from 'typescript';
import { Helper } from '../../../../compile/helper/Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [number]
// Output: [number]
export class CoerceToIntHelper extends Helper {
  // We add 0 to input number to coerce it to an IntegerStackItem
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions) {
    // [0, number]
    sb.emitPushInt(node, 0);
    // [number]
    sb.emitOp(node, 'ADD');
  }
}
