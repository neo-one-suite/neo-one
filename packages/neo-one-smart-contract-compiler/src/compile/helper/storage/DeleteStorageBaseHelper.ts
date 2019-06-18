import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: []
export class DeleteStorageBaseHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [storage, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.cacheStorage);
    // [keyBuffer, storage, keyBuffer]
    sb.emitOp(node, 'OVER');
    // [keyBuffer]
    sb.emitOp(node, 'REMOVE');
    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.deleteCacheStorage);
    // [keyBuffer, map]
    sb.emitOp(node, 'SWAP');
    // [boolean, keyBuffer, map]
    sb.emitPushBoolean(node, true);
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
