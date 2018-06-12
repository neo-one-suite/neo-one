import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';
import { Types } from '../Types';

// Input: [length, pobj, sobj, iobj, ...]
// Output: [objectVal]
export class PackObjectHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [object]
      sb.emitOp(node, 'PACK');
      // [objectType, object]
      sb.emitPushInt(node, Types.Object);
      // [2, objectType, object]
      sb.emitPushInt(node, 2);
      // [objectVal]
      sb.emitOp(node, 'PACK');
    }
  }
}
