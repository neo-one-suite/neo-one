import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [key, map]
// Output: [booleanVal]
export class MapDeleteHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'REMOVE');

      return;
    }

    // [map, keyVal]
    sb.emitOp(node, 'SWAP');
    // [map, key, map]
    sb.emitOp(node, 'TUCK');
    // [key, map, key, map]
    sb.emitOp(node, 'OVER');
    // [hasKey, key, map]
    sb.emitOp(node, 'HASKEY');
    // [map, hasKey, key]
    sb.emitOp(node, 'ROT');
    // [key, map, hasKey]
    sb.emitOp(node, 'ROT');
    // [hasKey]
    sb.emitOp(node, 'REMOVE');
    // [boolVal]
    sb.emitHelper(node, options, sb.helpers.wrapBoolean);
  }
}
