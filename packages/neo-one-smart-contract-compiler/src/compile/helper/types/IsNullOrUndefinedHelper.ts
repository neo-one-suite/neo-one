import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [val]
// Output: [boolean]
export class IsNullOrUndefinedHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
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
