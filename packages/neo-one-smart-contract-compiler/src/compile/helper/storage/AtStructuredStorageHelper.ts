import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [valKey, val]
// Output: []
export class AtStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
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
    // [valKeyArr, val, valKeyArr]
    sb.emitOp(node, 'TUCK');
    // [val, valKeyArr, valKeyArr]
    sb.emitOp(node, 'SWAP');
    // [struct, valKeyArr, valKeyArr]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [struct, valKeyArr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduce({
        each: (innerOptions) => {
          // [struct]
          sb.emitHelper(node, innerOptions, sb.helpers.handlePrefixArrayStructuredStorage);
        },
      }),
    );
    // [struct, valKeyArr, struct]
    sb.emitOp(node, 'TUCK');
    // [number, struct, valKeyArr, struct]
    sb.emitPushInt(node, StructuredStorageSlots.size);
    // [struct, number, struct, valKeyArr, struct]
    sb.emitOp(node, 'OVER');
    // [number, struct, number, struct, valKeyArr, struct]
    sb.emitPushInt(node, StructuredStorageSlots.size);
    // [size, number, struct, valKeyArr, struct]
    sb.emitOp(node, 'PICKITEM');
    // [3, size, number, struct, valKeyArr, struct]
    sb.emitPushInt(node, 3);
    // [valKeyArr, size, number, struct, struct]
    sb.emitOp(node, 'ROLL');
    // [addSize, size, number, struct, struct]
    sb.emitOp(node, 'ARRAYSIZE');
    // [size, number, struct, struct]
    sb.emitOp(node, 'ADD');
    // [struct]
    sb.emitOp(node, 'SETITEM');
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapVal({ type: this.type }));
  }
}
