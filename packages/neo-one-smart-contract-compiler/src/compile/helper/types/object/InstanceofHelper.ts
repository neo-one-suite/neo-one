import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [constructorObjectVal, objectVal]
// Output: [boolean]
export class InstanceofHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'DROP');
      return;
    }

    // ['prototype', constructorObjectVal, objectVal]
    sb.emitPushString(node, 'prototype');
    // [prototypeVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [objectVal, prototypeVal]
    sb.emitOp(node, 'SWAP');

    const prepareLoop = () => {
      // [objectVal, objectVal, prototypeVal]
      sb.emitOp(node, 'DUP');
      // ['prototype', objectVal, objectVal, prototypeVal]
      sb.emitPushString(node, 'prototype');
      // [nextPrototypeVal, objectVal, prototypeVal]
      sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
      // [nextPrototypeVal, nextPrototypeVal, objectVal, prototypeVal]
      sb.emitOp(node, 'DUP');
      // [objectVal, nextPrototypeVal, nextPrototypeVal, prototypeVal]
      sb.emitOp(node, 'ROT');
      // [3, objectVal, nextPrototypeVal, nextPrototypeVal, prototypeVal]
      sb.emitPushInt(node, 3);
      // [prototypeVal, objectVal, nextPrototypeVal, nextPrototypeVal, prototypeVal]
      sb.emitOp(node, 'PICK');
    };

    // [prototypeVal, objectVal, nextPrototypeVal, nextPrototypeVal, prototypeVal]
    prepareLoop();

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [samePrototype, nextPrototypeVal, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'EQUAL');
          // [samePrototype, samePrototype, nextPrototypeVal, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'DUP');
          // [notSamePrototype, samePrototype, nextPrototypeVal, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'NOT');
          // [nextPrototypeVal, notSamePrototype, samePrototype, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'ROT');
          // [isUndefined, notSamePrototype, samePrototype, nextPrototypeVal, prototypeVal]
          sb.emitHelper(node, options, sb.helpers.isUndefined);
          // [hasPrototype, notSamePrototype, samePrototype, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'NOT');
          // [hasPrototypeAndNotSame, samePrototype, nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'AND');
        },
        each: () => {
          // [nextPrototypeVal, prototypeVal]
          sb.emitOp(node, 'DROP');
          // [prototypeVal, objectVal, nextPrototypeVal, nextPrototypeVal, prototypeVal]
          prepareLoop();
        },
      }),
    );

    // [samePrototype, prototypeVal]
    sb.emitOp(node, 'NIP');
    // [samePrototype]
    sb.emitOp(node, 'NIP');
  }
}
