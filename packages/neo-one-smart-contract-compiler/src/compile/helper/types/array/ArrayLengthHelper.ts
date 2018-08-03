import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';

// Input: [arrayVal]
// Output: [number]
export class ArrayLengthHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [length]
    sb.emitOp(node, 'ARRAYSIZE');
  }
}
