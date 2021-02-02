import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyVal, map] - Note that "map" here is actually a struct [typeMap, valueMap]
// Output: [hasKey]
export class UnusedMapHasKeyHelper extends Helper {
  // TODO: need a push value DROP?
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [map, keyVal]
    sb.emitOp(node, 'SWAP');
    // [map, map, keyVal]
    sb.emitOp(node, 'DUP');
    // [0, map, map, keyVal]
    sb.emitPushInt(node, 0);
    // [typeMap, map, keyVal]
    sb.emitOp(node, 'PICKITEM');
    // [map, typeMap, keyVal]
    sb.emitOp(node, 'SWAP');
    // [1, map, typeMap, keyVal]
    sb.emitPushInt(node, 1);
    // [valueMap, typeMap, keyVal]
    sb.emitOp(node, 'PICKITEM');
    // [keyVal, valueMap, typeMap]
    sb.emitOp(node, 'ROT');
    // [size, keyType, key, valueMap, typeMap]
    sb.emitOp(node, 'UNPACK');
    // [keyType, key, valueMap, typeMap]
    sb.emitOp(node, 'DROP');
    // [key, keyType, valueMap, typeMap]
    sb.emitOp(node, 'SWAP');
    // [key, key, keyType, valueMap, typeMap]
    sb.emitOp(node, 'DUP');
    // [valueMap, keyType, key, key, typeMap]
    sb.emitOp(node, 'REVERSE4');
    // [key, valueMap, keyType, key, typeMap]
    sb.emitOp(node, 'ROT');
    // [hasKey]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [valueMapHasKey, keyType, key, typeMap]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // now check if types match
          // [typeMap, keyType, key]
          sb.emitOp(node, 'ROT');
          // [key, typeMap, keyType]
          sb.emitOp(node, 'ROT');
          // [key, key, typeMap, keyType]
          sb.emitOp(node, 'DUP');
          // [typeMap, key, key, keyType]
          sb.emitOp(node, 'ROT');
          // [typeMap, typeMap, key, key, keyType]
          sb.emitOp(node, 'DUP');
          // [key, typeMap, typeMap, key, keyType]
          sb.emitOp(node, 'ROT');
          // [hasKey]
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [typeMapHasKey, typeMap, key, keyType]
                sb.emitOp(node, 'HASKEY');
              },
              whenTrue: () => {
                // [key, typeMap, keyType]
                sb.emitOp(node, 'SWAP');
                // [keyType, keyType]
                sb.emitOp(node, 'PICKITEM');
                // [keyTypesMatch]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenFalse: () => {
                // [key, keyType]
                sb.emitOp(node, 'DROP');
                // [keyType]
                sb.emitOp(node, 'DROP');
                // []
                sb.emitOp(node, 'DROP');
                // [false]
                sb.emitPushBoolean(node, false);
              },
            }),
          );
        },
        whenFalse: () => {
          // [key, typeMap]
          sb.emitOp(node, 'DROP');
          // [typeMap]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          // [false]
          sb.emitPushBoolean(node, false);
        },
      }),
    );
  }
}
