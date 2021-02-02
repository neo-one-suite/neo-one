import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyVal, map] - Note that "map" here is actually a struct [typeMap, valueMap]
// Output: [boolVal]
export class UnusedMapDeleteHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [map, keyVal]
    sb.emitOp(node, 'SWAP');
    // [map, keyVal, map]
    sb.emitOp(node, 'TUCK');
    // [keyVal, map, keyVal, map]
    sb.emitOp(node, 'OVER');
    // [boolVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [hasKey, keyVal, map]
          sb.emitHelper(node, options, sb.helpers.mapHasKey);
        },
        whenTrue: () => {
          // [size, keyType, key, map]
          sb.emitOp(node, 'UNPACK');
          // [keyType, key, map]
          sb.emitOp(node, 'DROP');
          // [key, map]
          sb.emitOp(node, 'DROP');
          // [key, key, map]
          sb.emitOp(node, 'DUP');
          // [map, key, key]
          sb.emitOp(node, 'ROT');
          // [size, typeMap, valueMap, key, key]
          sb.emitOp(node, 'UNPACK');
          // [typeMap, valueMap, key, key]
          sb.emitOp(node, 'DROP');
          // [key, typeMap, valueMap, key]
          sb.emitOp(node, 'ROT');
          // [valueMap, key]
          sb.emitOp(node, 'REMOVE');
          // [key, valueMap]
          sb.emitOp(node, 'SWAP');
          // []
          sb.emitOp(node, 'REMOVE');
          if (optionsIn.pushValue) {
            // [true]
            sb.emitPushBoolean(node, true);
            // [boolVal]
            sb.emitHelper(node, options, sb.helpers.wrapBoolean);
          }
        },
        whenFalse: () => {
          // [map]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
          if (optionsIn.pushValue) {
            // [false]
            sb.emitPushBoolean(node, false);
            // [boolVal]
            sb.emitHelper(node, options, sb.helpers.wrapBoolean);
          }
        },
      }),
    );
  }
}
