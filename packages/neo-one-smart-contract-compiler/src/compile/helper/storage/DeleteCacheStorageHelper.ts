import { TriggerType } from '@neo-one/client-common';
import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [value]
export class DeleteCacheStorageHelper extends Helper {
  public readonly needsGlobal: boolean = true;
  public readonly needsGlobalOut = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.DeleteCacheStorage);
    // [map, number, globalObject]
    sb.emitOp(node, 'NEWMAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emitGlobalOut(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.DeleteCacheStorage);
    // [map]
    sb.emitOp(node, 'PICKITEM');
    // [number, map]
    sb.emitSysCall(node, 'System.Runtime.GetTrigger');
    // [number, number, map]
    sb.emitPushInt(node, TriggerType.Application);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, map]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitHelper(
            node,
            options,
            sb.helpers.mapForEachWithoutIterator({
              each: () => {
                // [context, keyBuffer, valBuffer]
                sb.emitSysCall(node, 'System.Storage.GetContext');
                // [valBuffer]
                sb.emitSysCall(node, 'System.Storage.Delete');
                // []
                sb.emitOp(node, 'DROP');
              },
            }),
          );
        },
        whenFalse: () => {
          // []
          sb.emitOp(node, 'DROP');
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
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.DeleteCacheStorage }));
  }
}
