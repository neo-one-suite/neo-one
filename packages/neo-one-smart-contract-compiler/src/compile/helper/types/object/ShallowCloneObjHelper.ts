import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [obj]
// Output: [obj]
export class ShallowCloneObjHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    /* create new obj */
    // [newObj, oldObj]
    sb.emitOp(node, 'NEWMAP');
    // [oldObj, newObj]
    sb.emitOp(node, 'SWAP');

    /* get keys and values */
    // [oldObj, oldObj, newObj]
    sb.emitOp(node, 'DUP');
    // [valuesArray, oldObj, newObj]
    sb.emitOp(node, 'VALUES');
    // [oldObj, valuesArray, newObj]
    sb.emitOp(node, 'SWAP');
    // [keysArray, valuesArray, newObj]
    sb.emitOp(node, 'KEYS');

    /* set keys/values on new obj */
    sb.withScope(node, options, (scopeOptions) => {
      const counter = sb.scope.addUnique();
      const length = sb.scope.addUnique();

      sb.emitHelper(
        node,
        scopeOptions,
        sb.helpers.forLoop({
          initializer: () => {
            // [keysArray, keysArray, valuesArray, newObj]
            sb.emitOp(node, 'DUP');
            // [length, keysArray, valuesArray, newObj]
            sb.emitOp(node, 'ARRAYSIZE');
            // [keysArray, valuesArray, newObj]
            sb.scope.set(sb, node, scopeOptions, length);
            // [counter, keysArray, valuesArray, newObj]
            sb.emitPushInt(node, 0);
            // [keysArray, valuesArray, newObj]
            sb.scope.set(sb, node, scopeOptions, counter);
          },
          condition: () => {
            // [counter]
            sb.scope.get(sb, node, scopeOptions, counter);
            // [length, counter]
            sb.scope.get(sb, node, scopeOptions, length);
            // [lt]
            sb.emitOp(node, 'LT');
          },
          incrementor: () => {
            // [counter]
            sb.scope.get(sb, node, scopeOptions, counter);
            // [counter]
            sb.emitOp(node, 'INC');
            // []
            sb.scope.set(sb, node, scopeOptions, counter);
          },
          each: (innerOptions) => {
            // [keysArray, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'TUCK');
            // [valuesArray, keysArray, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'OVER');
            // [counter, valuesArray, keysArray, valuesArray, keysArray, newObj]
            sb.scope.get(sb, node, innerOptions, counter);
            // [counter, valuesArray, counter, keysArray, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'TUCK');
            // [value, counter, keysArray, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'PICKITEM');
            // [keysArray, value, counter, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'ROT');
            // [counter, keysArray, value, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'ROT');
            // [key, value, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'PICKITEM');
            // [4, key, value, valuesArray, keysArray, newObj]
            sb.emitPushInt(node, 4);
            // [newObj, key, value, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'PICK');
            // [key, newObj, value, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'SWAP');
            // [value, key, newObj, valuesArray, keysArray, newObj]
            sb.emitOp(node, 'ROT');
            // [valuesArray, keysArray, newObj]
            sb.emitOp(node, 'SETITEM');
          },
        }),
      );
    });

    // [keysArray, newObj]
    sb.emitOp(node, 'DROP');
    // [newObj]
    sb.emitOp(node, 'DROP');
  }
}
