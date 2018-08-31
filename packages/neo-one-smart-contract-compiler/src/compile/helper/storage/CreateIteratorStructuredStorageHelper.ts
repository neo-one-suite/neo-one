import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [val]
// Output: [iterator]
export class CreateIteratorStructuredStorageHelper extends StructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }
    // [struct]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [number, struct]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [buffer]
    sb.emitOp(node, 'PICKITEM');
    // [iterator]
    sb.emitHelper(node, options, sb.helpers.iterStorage);
  }
}
