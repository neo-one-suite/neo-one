import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer, valBuffer]
// Output: []
export class PutStorageHelper extends Helper {
  public readonly needsGlobal = true;
  public readonly needsGlobalOut = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node): void {
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.CacheStorage);
    // [map, number, globalObject]
    sb.emitOp(node, 'NEWMAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emitGlobalOut(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.CacheStorage);
    // [map]
    sb.emitOp(node, 'PICKITEM');
    // [iterator]
    sb.emitSysCall(node, 'Neo.Iterator.Create');
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEach({
        each: () => {
          // [context, keyBuffer, valueBuffer]
          sb.emitOp(node, 'SWAP');
          // [context, keyBuffer, valueBuffer]
          sb.emitSysCall(node, 'Neo.Storage.GetContext');
          // []
          sb.emitSysCall(node, 'Neo.Storage.Put');
        },
      }),
    );
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [valBuffer, keyBuffer]
    sb.emitOp(node, 'SWAP');
    // [map, valBuffer, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CacheStorage }));
    // [keyBuffer, map, valBuffer]
    sb.emitOp(node, 'ROT');
    // [valBuffer, keyBuffer, map]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
