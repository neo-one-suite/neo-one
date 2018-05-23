import { Node } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

// Input: [pobj]
// Output: [objectVal]
export class CreatePropertyObjectHelper extends Helper<Node> {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      const obj = sb.scope.addUnique();
      const pobj = sb.scope.addUnique();
      // [pobj, pobj]
      sb.emitOp(node, 'DUP');
      // [pobj]
      sb.scope.set(sb, node, options, pobj);
      // [objectVal, pobj]
      sb.emitHelper(node, options, sb.helpers.createObject);
      // [objectVal, pobj, objectVal]
      sb.emitOp(node, 'TUCK');
      // [pobj, objectVal]
      sb.scope.set(sb, node, options, obj);
      // [keysArr, objectVal]
      sb.emitOp(node, 'KEYS');
      // [objectVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrForEach({
          each: () => {
            // [objectVal, key]
            sb.scope.get(sb, node, options, obj);
            // [pobj, objectVal, key]
            sb.scope.get(sb, node, options, pobj);
            // [key, pobj, objectVal]
            sb.emitOp(node, 'ROT');
            // [key, pobj, key, objectVal]
            sb.emitOp(node, 'TUCK');
            // [val, key, objectVal]
            sb.emitOp(node, 'PICKITEM');
            // []
            sb.emitHelper(
              node,
              options,
              sb.helpers.setDataPropertyObjectProperty,
            );
          },
        }),
      );
    }
  }
}
