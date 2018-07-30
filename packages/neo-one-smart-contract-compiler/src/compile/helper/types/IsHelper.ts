import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Types } from './Types';

// Input: [val]
// Output: [boolean]
export abstract class IsHelper extends Helper {
  protected abstract readonly type: Types;

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [0, value]
    sb.emitPushInt(node, 0);
    // [type]
    sb.emitOp(node, 'PICKITEM');
    // [type, type]
    sb.emitPushInt(node, this.type);
    // [isType]
    sb.emitOp(node, 'EQUAL');
  }
}
