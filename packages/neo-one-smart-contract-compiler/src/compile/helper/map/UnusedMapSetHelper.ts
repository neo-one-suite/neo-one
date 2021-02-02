import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [valVal, keyVal, map] - Note that "map" here is actually a struct [typeMap, valueMap]
// Output: []
export class UnusedMapSetHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [map, valVal, keyVal]
    sb.emitOp(node, 'ROT');
    // [size, typeMap, valueMap, valVal, keyVal]
    sb.emitOp(node, 'UNPACK');
    // [typeMap, valueMap, valVal, keyVal]
    sb.emitOp(node, 'DROP');
    // [keyVal, valVal, valueMap, typeMap]
    sb.emitOp(node, 'REVERSE4');
    // [size, keyType, key, valVal, valueMap, typeMap]
    sb.emitOp(node, 'UNPACK');
    // [keyType, key, valVal, valueMap, typeMap]
    sb.emitOp(node, 'DROP');
    // [key, keyType, valVal, valueMap, typeMap]
    sb.emitOp(node, 'SWAP');
    // [key, key, keyType, valVal, valueMap, typeMap]
    sb.emitOp(node, 'DUP');
    // [keyType, key, key, valVal, valueMap, typeMap]
    sb.emitOp(node, 'ROT');
    // [5, keyType, key, key, valVal, valueMap, typeMap]
    sb.emitPushInt(node, 5);
    // [typeMap, keyType, key, key, valVal, valueMap]
    sb.emitOp(node, 'ROLL');
    // [key, typeMap, keyType, key, valVal, valueMap]
    sb.emitOp(node, 'ROT');
    // [keyType, key, typeMap, key, valVal, valueMap]
    sb.emitOp(node, 'ROT');
    // [key, valVal, valueMap]
    sb.emitOp(node, 'SETITEM');
    // [valVal, key, valueMap]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
