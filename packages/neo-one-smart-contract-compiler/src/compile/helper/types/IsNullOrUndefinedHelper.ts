import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [boolean]
export class IsNullOrUndefinedHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [val, val]
    sb.emitOp(node, 'DUP');
    // [isNullBoolean, val]
    sb.emitHelper(node, options, sb.helpers.isNull);
    // [val, isNullBoolean]
    sb.emitOp(node, 'SWAP');
    // [isUndefinedBoolean, isNullBoolean]
    sb.emitHelper(node, options, sb.helpers.isUndefined);
    // [boolean]
    sb.emitOp(node, 'BOOLOR');
  }
}
