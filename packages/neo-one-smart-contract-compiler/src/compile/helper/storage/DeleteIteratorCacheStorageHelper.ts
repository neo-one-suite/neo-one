import { TriggerType } from '@neo-one/client-common';
import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [value]
export class DeleteIteratorCacheStorageHelper extends Helper {
  public readonly needsGlobal: boolean = true;
  public readonly needsGlobalOut = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.DeleteIteratorCacheStorage);
    // [arr, number, globalObject]
    sb.emitOp(node, 'NEWARRAY0');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emitGlobalOut(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.DeleteIteratorCacheStorage);
    // [arr]
    sb.emitOp(node, 'PICKITEM');
    // [number, arr]
    sb.emitSysCall(node, 'System.Runtime.GetTrigger');
    // [number, number, arr]
    sb.emitPushInt(node, TriggerType.Application);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean, arr]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // [map]
          sb.emitHelper(node, options, sb.helpers.arrToMap);
          // []
          sb.emitHelper(
            node,
            options,
            sb.helpers.mapForEachWithoutIterator({
              each: () => {
                // [valBuffer]
                sb.emitOp(node, 'DROP');
                // [context, valBuffer]
                sb.emitSysCall(node, 'System.Storage.GetContext');
                // []
                sb.emitSysCall(node, 'System.Storage.Delete');
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
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.DeleteIteratorCacheStorage }));
  }
}
