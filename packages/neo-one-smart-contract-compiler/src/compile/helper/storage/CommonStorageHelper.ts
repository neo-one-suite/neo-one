import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer, valBuffer]
// Output: [value]
export class CommonStorageHelper extends Helper {
  public readonly needsGlobal: boolean = true;
  public readonly needsGlobalOut = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.CommonStorageSerialized);
    // [globalObject, number, globalObject]
    sb.emitOp(node, 'OVER');
    // [number, globalObject, number, globalObject]
    sb.emitPushInt(node, GlobalProperty.CommonStorage);
    // [buffer, number, globalObject, number, globalObject]
    sb.emitPushBuffer(node, Buffer.alloc(0, 0));
    // [value, number, globalObject, number, globalObject]
    sb.emitHelper(node, options, sb.helpers.getStorageBase);
    sb.emitHelper(
      node,
      options,
      sb.helpers.handleUndefinedStorage({
        handleUndefined: () => {
          // [map, number, globalObject, number, globalObject]
          sb.emitOp(node, 'NEWMAP');
          // [map, map, number, globalObject, number, globalObject]
          sb.emitOp(node, 'DUP');
          // [buffer, map, number, globalObject, number, globalObject]
          sb.emitSysCall(node, 'Neo.Runtime.Serialize');
        },
        handleDefined: () => {
          // [buffer, buffer, number, globalObject, number, globalObject]
          sb.emitOp(node, 'DUP');
          // [map, buffer, number, globalObject, number, globalObject]
          sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          // [buffer, map, number, globalObject, number, globalObject]
          sb.emitOp(node, 'SWAP');
        },
      }),
    );
    // [number, buffer, map, number, globalObject, number, globalObject]
    sb.emitPushInt(node, 4);
    // [buffer, map, number, globalObject, buffer, number, globalObject]
    sb.emitOp(node, 'XTUCK');
    // [map, number, globalObject, buffer, number, globalObject]
    sb.emitOp(node, 'DROP');
    // [buffer, number, globalObject]
    sb.emitOp(node, 'SETITEM');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emitGlobalOut(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [globalObject, globalObject]
    sb.emitOp(node, 'DUP');
    // [number, globalObject, globalObject]
    sb.emitPushInt(node, GlobalProperty.CommonStorageSerialized);
    // [bufferOriginal, globalObject]
    sb.emitOp(node, 'PICKITEM');
    // [globalObject, bufferOriginal]
    sb.emitOp(node, 'SWAP');
    // [number, globalObject, bufferOriginal]
    sb.emitPushInt(node, GlobalProperty.CommonStorage);
    // [map, bufferOriginal]
    sb.emitOp(node, 'PICKITEM');
    // [buffer, bufferOriginal]
    sb.emitSysCall(node, 'Neo.Runtime.Serialize');
    // [buffer, bufferOriginal, buffer]
    sb.emitOp(node, 'TUCK');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, buffer]
          sb.emitOp(node, 'EQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
        },
        whenFalse: () => {
          // [keyBuffer, valueBuffer]
          sb.emitPushBuffer(node, Buffer.alloc(0, 0));
          // [context, keyBuffer, valBuffer]
          sb.emitSysCall(node, 'Neo.Storage.GetContext');
          // []
          sb.emitSysCall(node, 'Neo.Storage.Put');
        },
      }),
    );
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      return;
    }
    // [map]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CommonStorage }));
  }
}
