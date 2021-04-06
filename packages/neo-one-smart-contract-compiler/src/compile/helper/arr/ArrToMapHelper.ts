import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [arr]
// Output: [map]
// Converts a map to an array where the array value's index is the key
export class ArrToMapHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [arr, arr]
    sb.emitOp(node, 'DUP');
    // [map, arr, arr]
    sb.emitOp(node, 'NEWMAP');
    // [arr, map, arr]
    sb.emitOp(node, 'SWAP');
    // [size, map, arr]
    sb.emitOp(node, 'SIZE');
    // [idx, size, map, arr]
    sb.emitPushInt(node, 0);
    // [map]
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [idx, idx, size, map, arr]
          sb.emitOp(node, 'DUP');
          // [size, idx, idx, map, arr]
          sb.emitOp(node, 'ROT');
          // [size, size, idx, idx, map, arr]
          sb.emitOp(node, 'DUP');
          // [idx, size, size, idx, map, arr]
          sb.emitOp(node, 'ROT');
          // [size > idx, size, idx, map, arr]
          sb.emitOp(node, 'GT');
        },
        each: () => {
          // [arr, map, idx, size]
          sb.emitOp(node, 'REVERSE4');
          // [idx, arr, map, size]
          sb.emitOp(node, 'ROT');
          // [idx, idx, arr, map, size]
          sb.emitOp(node, 'DUP');
          // [arr, idx, idx, map, size]
          sb.emitOp(node, 'ROT');
          // [arr, arr, idx, idx, map, size]
          sb.emitOp(node, 'DUP');
          // [idx, arr, arr, idx, map, size]
          sb.emitOp(node, 'ROT');
          // [arrVal, arr, idx, map, size]
          sb.emitOp(node, 'PICKITEM');
          // [map, idx, arr, arrVal, size]
          sb.emitOp(node, 'REVERSE4');
          // [map, map, idx, arr, arrVal, size]
          sb.emitOp(node, 'DUP');
          // [idx, map, map, arr, arrVal, size]
          sb.emitOp(node, 'ROT');
          // [idx, idx, map, map, arr, arrVal, size]
          sb.emitOp(node, 'DUP');
          // [map, idx, idx, map, arr, arrVal, size]
          sb.emitOp(node, 'ROT');
          // [idx, map, idx, map, arr, arrVal, size]
          sb.emitOp(node, 'SWAP');
          // [number, idx, map, idx, map, arr, arrVal, size]
          sb.emitPushInt(node, 5);
          // [arrVal, idx, map, idx, map, arr, size]
          sb.emitOp(node, 'ROLL');
          // [idx, map, arr, size]
          sb.emitOp(node, 'SETITEM');
          // [idx, map, arr, size]
          sb.emitOp(node, 'INC');
          // [size, arr, map, idx]
          sb.emitOp(node, 'REVERSE4');
          // [map, size, arr, idx]
          sb.emitOp(node, 'ROT');
          // [arr, map, size, idx]
          sb.emitOp(node, 'ROT');
          // [idx, size, map, arr]
          sb.emitOp(node, 'REVERSE4');
        },
        cleanup: () => {
          // [idx, map, arr]
          sb.emitOp(node, 'DROP');
          // [map, arr]
          sb.emitOp(node, 'DROP');
          // [map]
          sb.emitOp(node, 'NIP');
        },
      }),
    );
  }
}
