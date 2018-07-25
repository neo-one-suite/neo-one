import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Types } from './Types';

// Input: [value]
// Output: [val]
export abstract class CreatePrimitiveHelper extends Helper {
  protected readonly length: number = 2;
  protected abstract readonly type: Types;

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [type, value]
    sb.emitPushInt(node, this.type);
    // [2, type, value]
    sb.emitPushInt(node, this.length);
    // [[type, value]]
    sb.emitOp(node, 'PACK');
  }
}
