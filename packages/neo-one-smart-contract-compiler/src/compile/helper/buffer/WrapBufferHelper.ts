import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [byteArray]
// Output: [objectVal]
export class WrapBufferHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [objectVal, byteArray]
    sb.emitHelper(node, options, sb.helpers.createBuffer);
    // [objectVal, byteArray, objectVal]
    sb.emitOp(node, 'TUCK');
    // [byteArray, objectVal, objectVal]
    sb.emitOp(node, 'SWAP');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setBufferValue);
  }
}
