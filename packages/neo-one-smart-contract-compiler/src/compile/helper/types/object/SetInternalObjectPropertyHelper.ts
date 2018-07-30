import ts from 'typescript';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetInternalObjectPropertyHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, val, stringProp]
    sb.emitOp(node, 'ROT');
    // [obj, val, stringProp]
    sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.getInternalObject);
    // [stringProp, obj, val]
    sb.emitOp(node, 'ROT');
    // [val, stringProp, obj]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
