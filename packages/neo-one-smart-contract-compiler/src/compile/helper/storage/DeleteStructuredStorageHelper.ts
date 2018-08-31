import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [valKey, val]
// Output: [val]
export class DeleteStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [bufferKey]
    sb.emitHelper(
      node,
      options,
      sb.helpers.getKeyStructuredStorage({ type: this.type, keyType: this.keyType, knownKeyType: this.knownKeyType }),
    );
    // [boolean]
    sb.emitHelper(node, optionsIn, sb.helpers.deleteStorage);

    if (optionsIn.pushValue) {
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    }
  }
}
