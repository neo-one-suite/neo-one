import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [map]
// Output: [objectVal]
export class WrapMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [Map, map]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: 'Map' }));
    // [objectVal, map]
    sb.emitHelper(node, options, sb.helpers.new({ noArgs: true }));
    // [objectVal, map, objectVal]
    sb.emitOp(node, 'TUCK');
    // [map, objectVal, objectVal]
    sb.emitOp(node, 'SWAP');
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.setMapValue);
  }
}
