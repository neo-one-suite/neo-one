import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class ThrowTypeErrorHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // ['TypeError']
    sb.emitPushString(node, 'TypeError');
    // [value]
    sb.emitHelper(node, options, sb.helpers.createString);
    // []
    sb.emitHelper(node, options, sb.helpers.throw);
  }
}
