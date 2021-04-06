import { StackItemType } from '@neo-one/client-common';
import ts from 'typescript';
import { StructuredStorageSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { KeyStructuredStorageBaseHelper } from './KeyStructuredStorageBaseHelper';

// Input: [valValue, valKey, val]
// Output: []
export class SetStructuredStorageHelper extends KeyStructuredStorageBaseHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [valKey, valValue, val]
    sb.emitOp(node, 'SWAP');
    // [valKeyArr, valValue, val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.unwrapKeyStructuredStorage({
        type: this.keyType,
        knownType: this.knownKeyType,
      }),
    );
    // [val, valKeyArr, valValue]
    sb.emitOp(node, 'ROT');
    // [struct, valKeyArr, valValue]
    sb.emitHelper(node, options, sb.helpers.unwrapVal({ type: this.type }));
    // [struct, valValue]
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
    // [struct, struct, valValue]
    sb.emitOp(node, 'DUP');
    // [number, struct, struct, valValue]
    sb.emitPushInt(node, StructuredStorageSlots.prefix);
    // [keyBuffer, struct, valValue]
    sb.emitOp(node, 'PICKITEM');
    // [keyBuffer, struct, valValue]
    sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
    // [struct, keyBuffer, valValue]
    sb.emitOp(node, 'SWAP');
    // [number, struct, keyBuffer, valValue]
    sb.emitPushInt(node, StructuredStorageSlots.prefixArray);
    // [keyArray, keyBuffer, valValue]
    sb.emitOp(node, 'PICKITEM');
    // [valKey, keyBuffer, valValue]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
    // [valValue, valKey, keyBuffer]
    sb.emitOp(node, 'ROT');
    // [valKey, valValue, keyBuffer]
    sb.emitOp(node, 'SWAP');
    // [2, valKey, valValue, keyBuffer]
    sb.emitPushInt(node, 2);
    // [arr, keyBuffer]
    sb.emitOp(node, 'PACK');
    // [bufferValue, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.binarySerialize);
    // [keyBuffer, bufferValue]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitHelper(node, options, sb.helpers.putStorage);
  }
}
