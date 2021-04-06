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
    // [context, keyBuffer, number keyBuffer]
    sb.emitSysCall(node, 'System.Storage.GetReadOnlyContext');
    // [iterator, keyBuffer]
    sb.emitSysCall(node, 'System.Storage.Find');
    // [keyBuffer, iterator]
    sb.emitOp(node, 'SWAP');
    const key = sb.scope.addUnique();
    // [iterator]
    sb.scope.set(sb, node, options, key);
    // [map, iterator]
    sb.emitHelper(node, options, sb.helpers.cacheStorage);
    // [map, iterator]
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
          // [boolean]
          sb.emitOp(node, 'EQUAL');
        },
      }),
    );
    // [iterator, iterator]
    sb.emitSysCall(node, 'System.Iterator.Create');
    // [iterator]
    sb.emitSysCall(node, 'System.Iterator.Concat');
  }
}
