import ts from 'typescript';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [valueVal, number, val]
// Output: []
export class SetArrayStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val, valueVal, number]
    sb.emitOp(node, 'ROT');
    // [val, val, valueVal, number]
    sb.emitOp(node, 'DUP');
    // [length, val, valueVal, number]
    sb.emitHelper(node, options, sb.helpers.getArrayStorageLength);
    // [3, length, val, valueVal, number]
    sb.emitPushInt(node, 3);
    // [number, length, val, valueVal, number]
    sb.emitOp(node, 'PICK');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [length <= number, val, valueVal, number]
          sb.emitOp(node, 'LE');
        },
        whenTrue: () => {
          // [val, val, valueVal, number]
          sb.emitOp(node, 'DUP');
          // [3, val, val, valueVal, number]
          sb.emitPushInt(node, 3);
          // [number, val, val, valueVal, number]
          sb.emitOp(node, 'PICK');
          // [number, val, val, valueVal, number]
          sb.emitOp(node, 'INC');
          // [val, valueVal, number]
          sb.emitHelper(node, options, sb.helpers.putArrayStorageLength);
        },
      }),
    );
    // [number, val, valueVal]
    sb.emitOp(node, 'ROT');
    // [numberVal, val, valueVal]
    sb.emitHelper(node, options, sb.helpers.wrapNumber);
    // [valueVal, numberVal, val]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitHelper(
      node,
      options,
      sb.helpers.setStructuredStorage({ type: Types.ArrayStorage, keyType: undefined, knownKeyType: Types.Number }),
    );
  }
}
