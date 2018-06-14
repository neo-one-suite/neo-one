import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val, indexNumber, objectVal]
// Output: []
export class SetArrayIndexHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [objectVal, val, indexNumber]
          sb.emitOp(node, 'ROT');
          // [indexNumber, objectVal, val]
          sb.emitOp(node, 'ROT');
          // [objectVal, indexNumber, objectVal, val]
          sb.emitOp(node, 'OVER');
          // ['length', objectVal, indexNumber, objectVal, val]
          sb.emitPushString(node, 'length');
          // [lengthNumberVal, indexNumber, objectVal, val]
          sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
          // [lengthNumber, indexNumber, objectVal, val]
          sb.emitHelper(node, options, sb.helpers.getNumber);
          // [indexNumber, lengthNumber, indexNumber, objectVal, val]
          sb.emitOp(node, 'OVER');
          // [lessThanLength, indexNumber, objectVal, val]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [objectVal, indexNumber, val]
          sb.emitOp(node, 'SWAP');
          // []
          this.setIndex(sb, node, options);
        },
        whenFalse: () => {
          // [objectVal, indexNumber, objectVal, val]
          sb.emitOp(node, 'OVER');
          // [arr, indexNumber, objectVal, val]
          sb.emitHelper(node, options, sb.helpers.getArrayValue);
          // [indexNumber, arr, indexNumber, objectVal, val]
          sb.emitOp(node, 'OVER');
          // [indexNumber + 1, arr, indexNumber, objectVal, val]
          sb.emitOp(node, 'INC');
          // [length, arr, length, indexNumber, objectVal, val]
          sb.emitOp(node, 'TUCK');
          // [length, indexNumber, objectVal, val]
          sb.emitHelper(node, options, sb.helpers.extendArray);
          // [objectVal, length, indexNumber, val]
          sb.emitOp(node, 'ROT');
          // [objectVal, length, objectVal, indexNumber, val]
          sb.emitOp(node, 'TUCK');
          // ['length', objectVal, length, objectVal, indexNumber, val]
          sb.emitPushString(node, 'length');
          // [length, 'length', objectVal, objectVal, indexNumber, val]
          sb.emitOp(node, 'ROT');
          // [lengthVal, 'length', objectVal, objectVal, indexNumber, val]
          sb.emitHelper(node, options, sb.helpers.createNumber);
          // [objectVal, indexNumber, val]
          sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
          // []
          this.setIndex(sb, node, options);
        },
      }),
    );
  }

  private setIndex(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [arr, indexNumber, val]
    sb.emitHelper(node, options, sb.helpers.getArrayValue);
    // [indexNumber, arr, val]
    sb.emitOp(node, 'SWAP');
    // [val, indexNumber, arr]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
