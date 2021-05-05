import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer, valBuffer]
// Output: []
export class PutStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [keyBuffer, valBuffer]
    sb.emitHelper(node, options, sb.helpers.sliceKey);
    // [keyBuffer, valBuffer, keyBuffer]
    sb.emitOp(node, 'TUCK');
    // [map, keyBuffer, valBuffer, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.cacheStorage);
    // [keyBuffer, map, valBuffer, keyBuffer]
    sb.emitOp(node, 'SWAP');
    // [valBuffer, keyBuffer, map, keyBuffer]
    sb.emitOp(node, 'ROT');
    // [keyBuffer]
    sb.emitOp(node, 'SETITEM');
    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.deleteCacheStorage);
    // [keyBuffer, map]
    sb.emitOp(node, 'SWAP');
    // []
    sb.emitOp(node, 'REMOVE');
  }
}
