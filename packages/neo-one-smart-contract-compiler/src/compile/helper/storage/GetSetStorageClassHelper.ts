import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createConstructor, createDelete, createGet, createGetKey, createSet } from './common';

// Input: [val]
// Output: [val]
export class GetSetStorageClassHelper extends Helper {
  public readonly needsGlobal: boolean = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const outerOptions = sb.pushValueOptions(optionsIn);

    const getKey = createGetKey(sb, node);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.SetStorage);
    // [classVal, number, globalObjectVal]
    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createClass({
        ctor: createConstructor(sb, node),
        prototypeMethods: {
          has: createGet(sb, node, getKey, (innerOptions) => {
            // [boolean]
            sb.emitPushBoolean(node, false);
            // [val]
            sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
          }),
          add: createSet(sb, node, getKey, (innerOptions) => {
            // [buffer]
            sb.emitOp(node, 'NIP');
            // [boolean, buffer]
            sb.emitPushBoolean(node, true);
            // [val, buffer]
            sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
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
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.SetStorage }));
  }
}
