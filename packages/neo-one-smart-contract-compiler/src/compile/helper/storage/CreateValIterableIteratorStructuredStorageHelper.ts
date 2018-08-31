import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { StructuredStorageBaseHelper } from './StructuredStorageBaseHelper';

// Input: [val]
// Output: [val]
export class CreateValIterableIteratorStructuredStorageHelper extends StructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.createIterableIteratorStructuredStorageBase({
        type: this.type,
        handleNext: (innerOptions) => {
          // [valVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.handleValValueStructuredStorage);
        },
      }),
    );
  }
}
