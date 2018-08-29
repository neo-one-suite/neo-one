import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer]
// Output: [value]
export class GetStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [map, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CacheStorage }));
    // [map, keyBuffer, map]
    sb.emitOp(node, 'TUCK');
    // [keyBuffer, map, keyBuffer, map]
    sb.emitOp(node, 'OVER');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, keyBuffer, map]
          sb.emitOp(node, 'HASKEY');
        },
        whenTrue: () => {
          // [value]
          sb.emitOp(node, 'PICKITEM');
        },
        whenFalse: () => {
          // [keyBuffer, map, keyBuffer]
          sb.emitOp(node, 'TUCK');
          // [value, map, keyBuffer]
          sb.emitHelper(node, options, sb.helpers.getStorageBase);
          // [value, map, value, keyBuffer]
          sb.emitOp(node, 'TUCK');
          // [number, value, map, value, keyBuffer]
          sb.emitPushInt(node, 3);
          // [keyBuffer, value, map, value]
          sb.emitOp(node, 'ROLL');
          // [value, keyBuffer, map, value]
          sb.emitOp(node, 'SWAP');
          // [value]
          sb.emitOp(node, 'SETITEM');
        },
      }),
    );

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
