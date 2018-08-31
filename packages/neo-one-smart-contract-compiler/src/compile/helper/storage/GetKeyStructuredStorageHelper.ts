import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [valKey, val]
// Output: [bufferKey]
export class GetKeyStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [valKeyArr, val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.unwrapKeyStructuredStorage({
        type: this.keyType,
        knownType: this.knownKeyType,
      }),
    );
    // [val, valKeyArr]
    sb.emitOp(node, 'SWAP');
    // [struct, valKeyArr]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [number, struct, valKeyArr]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [prefix, valKeyArr]
    sb.emitOp(node, 'PICKITEM');
    // [prefix]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduce({
        each: () => {
          // [val, prefix]
          sb.emitOp(node, 'SWAP');
          // [buffer, prefix]
          sb.emitSysCall(node, 'Neo.Runtime.Serialize');
          // [prefix]
          sb.emitOp(node, 'CAT');
        },
      }),
    );
  }
}
