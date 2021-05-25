import { StackItemType } from '@neo-one/client-common';
import ts from 'typescript';
import { FindOptions } from '../../../types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [iterator]
export class IterStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [keyBuffer, keyBuffer]
    sb.emitOp(node, 'DUP');
    // [number, keyBuffer, keyBuffer]
    sb.emitPushInt(node, FindOptions.None);
    // [keyBuffer, number, keyBuffer]
    sb.emitOp(node, 'SWAP');
    // [context, keyBuffer, number, keyBuffer]
    sb.emitSysCall(node, 'System.Storage.GetReadOnlyContext');
    // [iterator, keyBuffer]
    sb.emitSysCall(node, 'System.Storage.Find');
    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.iteratorToMap);
    // [storageArr, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.mapToNestedArr);
    // [keyBuffer, storageArr]
    sb.emitOp(node, 'SWAP');
    const key = sb.scope.addUnique();
    // [storageArr]
    sb.scope.set(sb, node, options, key);
    // [map, storageArr]
    sb.emitHelper(node, options, sb.helpers.cacheStorage);
    // [map, storageArr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.mapFilter({
        map: (innerOptions) => {
          // [keyBuffer]
          sb.emitOp(node, 'NIP');
          // [expectedKeyBuffer, keyBuffer]
          sb.scope.get(sb, node, innerOptions, key);
          // [expectedKeyBuffer, keyBuffer, expectedKeyBuffer]
          sb.emitOp(node, 'TUCK');
          // [length, keyBuffer, expectedKeyBuffer]
          sb.emitOp(node, 'SIZE');
          // [keyBuffer, expectedKeyBuffer]
          sb.emitOp(node, 'LEFT');
          // [keyBuffer, expectedKeyBuffer]
          sb.emitOp(node, 'CONVERT', Buffer.from([StackItemType.ByteString]));
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
      }),
    );
    // It's important that these arrays are in this order before being concatenated
    // so that the cached values are read later in the iteration when converting the
    // concatenated array into a map. If there are duplicate keys in the map then the later
    // ones the cache will override the previous ones from storage
    // [cacheArr, storageArr]
    sb.emitHelper(node, options, sb.helpers.mapToNestedArr);
    // [nestedArr]
    sb.emitHelper(node, options, sb.helpers.arrConcat);
    // [map]
    sb.emitHelper(node, options, sb.helpers.nestedArrToMap);
    // [iterator]
    sb.emitHelper(node, options, sb.helpers.createMapIterator);
  }
}
