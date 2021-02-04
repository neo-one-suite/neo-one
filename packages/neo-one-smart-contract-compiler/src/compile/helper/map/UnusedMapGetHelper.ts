import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyVal, map] - Note that "map" here is actually a struct [typeMap, valueMap]
// Output: [val]
export class UnusedMapGetHelper extends Helper {
  // TODO: add pushvalue option?
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [size, keyType, key, map]
    sb.emitOp(node, 'UNPACK');
    // [keyType, key, map]
    sb.emitOp(node, 'DROP');
    // [key, map]
    sb.emitOp(node, 'DROP');
    // [map, key]
    sb.emitOp(node, 'SWAP');
    // [size, typeMap, valueMap, key]
    sb.emitOp(node, 'UNPACK');
    // [typeMap, valueMap, key]
    sb.emitOp(node, 'DROP');
    // [valueMap, key]
    sb.emitOp(node, 'DROP');
    // [key, valueMap]
    sb.emitOp(node, 'SWAP');
    // [val]
    sb.emitOp(node, 'PICKITEM');
  }
}
