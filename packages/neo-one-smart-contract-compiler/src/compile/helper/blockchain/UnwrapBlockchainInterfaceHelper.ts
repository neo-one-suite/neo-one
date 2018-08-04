import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [objectVal]
// Output: [blockchainInterface]
export class UnwrapBlockchainInterfaceHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    // [number, objectVal]
    sb.emitPushInt(node, InternalObjectProperty.BlockchainInterface);
    // [blockchainInterface]
    sb.emitHelper(node, options, sb.helpers.getInternalObjectProperty);
  }
}
