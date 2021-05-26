import { StackItemType } from '@neo-one/client-common';
import { randomBytes } from 'crypto';
import ts from 'typescript';
import { FindOptions } from '../../../types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// When iterating through the items each key needs slice off prefix bytes then deserialize
// Then every value needs to be deserialized as well. See `DeserializeIteratorKeyHelper`

export const prefixSize = 6;

// Input: [map]
// Output: [iterator]
export class CreateMapIteratorHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const prefix = randomBytes(prefixSize);

    // [map, map]
    sb.emitOp(node, 'DUP');
    // [map]
    sb.emitHelper(
      node,
      options,
      sb.helpers.mapForEachWithoutIterator({
        each: () => {
          // [keyBuffer, val]
          sb.emitHelper(node, options, sb.helpers.binarySerialize);
          // [val, keyBuffer]
          sb.emitOp(node, 'SWAP');
          // [valBuffer, keyBuffer]
          sb.emitHelper(node, options, sb.helpers.binarySerialize);
          // [keyBuffer, valBuffer]
          sb.emitOp(node, 'SWAP');
          // [prefix, keyBuffer, valBuffer]
          sb.emitPushBuffer(node, prefix);
          // [keyBuffer, prefix, valBuffer]
          sb.emitOp(node, 'SWAP');
          // [keyBuffer, valBuffer]
          sb.emitOp(node, 'CAT');
          // [keyBuffer, valBuffer]
          sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
          // [context, keyBuffer, valBuffer]
          sb.emitSysCall(node, 'System.Storage.GetContext');
          // []
          sb.emitSysCall(node, 'System.Storage.Put');
        },
      }),
    );
    // [findOptions, map]
    sb.emitPushInt(node, FindOptions.None);
    // [prefix, findOptions, map]
    sb.emitPushBuffer(node, prefix);
    // [context, prefix, findOptions, map]
    sb.emitSysCall(node, 'System.Storage.GetReadOnlyContext');
    // [iterator, map]
    sb.emitSysCall(node, 'System.Storage.Find');
    // [map, iterator]
    sb.emitOp(node, 'SWAP');
    // [iterator]
    sb.emitHelper(
      node,
      options,
      sb.helpers.mapForEachWithoutIterator({
        each: () => {
          // [val, key]
          sb.emitOp(node, 'SWAP');
          // [key]
          sb.emitOp(node, 'DROP');
          // [keyBuffer]
          sb.emitHelper(node, options, sb.helpers.binarySerialize);
          // [prefix, keyBuffer]
          sb.emitPushBuffer(node, prefix);
          // [keyBuffer, prefix]
          sb.emitOp(node, 'SWAP');
          // [keyBuffer]
          sb.emitOp(node, 'CAT');
          // [keyBuffer]
          sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
          // [arr, keyBuffer]
          sb.emitHelper(node, options, sb.helpers.deleteIteratorCacheStorage);
          // [keyBuffer, arr]
          sb.emitOp(node, 'SWAP');
          // []
          sb.emitOp(node, 'APPEND');
        },
      }),
    );
  }
}
