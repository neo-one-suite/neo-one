import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [number]
// Output: [value]
export class GetArgumentHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }
    // [argv]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.Arguments }));
    // [number, argv]
    sb.emitOp(node, 'SWAP');
    // [value]
    sb.emitOp(node, 'PICKITEM');
  }
}
