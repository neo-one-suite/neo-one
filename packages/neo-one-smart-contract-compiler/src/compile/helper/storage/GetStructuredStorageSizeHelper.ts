import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [val]
// Output: [size]
export class GetStructuredStorageSizeHelper extends StructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [struct]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [number]
    sb.emitPushInt(node, StructuredStorageSlots.size);
    // [size]
    sb.emitOp(node, 'PICKITEM');
  }
}
