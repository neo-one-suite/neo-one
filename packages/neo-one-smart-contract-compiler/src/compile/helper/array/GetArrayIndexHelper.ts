import { Node } from 'ts-simple-ast';

import { Helper } from '../Helper';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

// Input: [indexNumber, objectVal]
// Output: [val]
export class GetArrayIndexHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [objectVal, indexNumber, objectVal]
          sb.emitOp(node, 'OVER');
          // ['length', objectVal, indexNumber, objectVal]
          sb.emitPushString(node, 'length');
          // [lengthNumberVal, indexNumber, objectVal]
          sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
          // [lengthNumber, indexNumber, objectVal]
          sb.emitHelper(node, options, sb.helpers.getNumber);
          // [indexNumber, lengthNumber, indexNumber, objectVal]
          sb.emitOp(node, 'OVER');
          // [lessThanLength, indexNumber, objectVal]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [objectVal, indexNumber]
          sb.emitOp(node, 'SWAP');
          // [arr, indexNumber]
          sb.emitHelper(node, options, sb.helpers.getArrayValue);
          // [indexNumber, arr]
          sb.emitOp(node, 'SWAP');
          // []
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [indexNumber]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.createUndefined);
        },
      }),
    );
  }
}
