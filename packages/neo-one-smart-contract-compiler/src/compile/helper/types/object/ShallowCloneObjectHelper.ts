import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';
import { Types } from '../Types';

// Input: [objectVal]
// Output: [objectVal]
export class ShallowCloneObjectHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    // [object]
    sb.emitHelper(node, options, sb.helpers.getObject);
    // [length, pobj, sobj, iobj, ...]
    sb.emitOp(node, 'UNPACK');

    const roll = () => {
      // [3, length, pobj, sobj, iobj, ...]
      sb.emitPushInt(node, 3);
      // [iobj, length, pobj, sobj, ...]
      sb.emitOp(node, 'ROLL');
    };

    const clone = () => {
      roll();
      // [iobj, length, pobj, sobj, ...]
      sb.emitHelper(node, options, sb.helpers.shallowCloneObj);
    };

    // [iobj, length, pobj, sobj, ...]
    clone();
    // [sobj, iobj, length, pobj, ...]
    clone();
    // [pobj, sobj, iobj, length, ...]
    clone();
    // [length, pobj, sobj, iobj, ...]
    roll();
    // [object]
    sb.emitOp(node, 'PACK');

    // [objectType, object]
    sb.emitPushInt(node, Types.Object);

    /* create object */
    // [2, objectType, object]
    sb.emitPushInt(node, 2);
    // [objectVal]
    sb.emitOp(node, 'PACK');
  }
}
