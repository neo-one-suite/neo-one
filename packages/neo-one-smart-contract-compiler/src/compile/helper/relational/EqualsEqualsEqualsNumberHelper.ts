import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [numberVal, numberVal]
// Output: [boolean]
export class EqualsEqualsEqualsNumberHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');

      return;
    }

    // [number, numberVal]
    sb.emitHelper(node, options, sb.helpers.getNumber);
    // [numberVal, number]
    sb.emitOp(node, 'SWAP');
    // [number, number]
    sb.emitHelper(node, options, sb.helpers.getNumber);
    // [boolean]
    sb.emitOp(node, 'NUMEQUAL');
  }
}
