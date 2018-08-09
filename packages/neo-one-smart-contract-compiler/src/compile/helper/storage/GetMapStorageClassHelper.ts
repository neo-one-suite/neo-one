import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createConstructor, createDelete, createGet, createGetKey, createSet } from './common';

// Input: [val]
// Output: [val]
export class GetMapStorageClassHelper extends Helper {
  public readonly needsGlobal: boolean = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const outerOptions = sb.pushValueOptions(optionsIn);

    const getKey = createGetKey(sb, node);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.MapStorage);
    // [classVal, number, globalObjectVal]
    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createClass({
        ctor: createConstructor(sb, node),
        prototypeMethods: {
          get: createGet(sb, node, getKey, (innerOptions) => {
            // [val]
            sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
          }),
          set: createSet(sb, node, getKey, () => {
            // [argsarr, buffer]
            sb.emitOp(node, 'SWAP');
            // [1, argsarr, buffer]
            sb.emitPushInt(node, 1);
            // [val, buffer]
            sb.emitOp(node, 'PICKITEM');
          }),
          delete: createDelete(sb, node, getKey),
        },
      }),
    );
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      return;
    }
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.MapStorage }));
  }
}
