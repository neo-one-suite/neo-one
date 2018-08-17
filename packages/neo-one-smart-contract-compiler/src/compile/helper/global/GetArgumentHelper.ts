import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { TypedHelper } from '../types';

// Input: [numberVal]
// Output: [value]
export class GetArgumentHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }
    // [argv]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.Arguments }));
    // [numberVal, argv]
    sb.emitOp(node, 'SWAP');
    // [number, argv]
    sb.emitHelper(node, options, sb.helpers.toNumber({ type: this.type }));
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
