import ts from 'typescript';
import { GlobalProperty, InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [val]
export class GetMapClassHelper extends Helper {
  public readonly needsGlobal: boolean = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const outerOptions = sb.pushValueOptions(optionsIn);

    const clear = (innerOptionsIn: VisitOptions) => {
      const innerOptions = sb.pushValueOptions(innerOptionsIn);
      // []
      sb.emitOp(node, 'DROP');
      // [objectVal]
      sb.scope.getThis(sb, node, innerOptions);
      // [number, objectVal]
      sb.emitPushInt(node, InternalObjectProperty.Map);
      // [obj, number, objectVal]
      sb.emitOp(node, 'NEWMAP');
      // []
      sb.emitHelper(node, innerOptions, sb.helpers.setInternalObjectProperty);
    };

    const getMap = (innerOptions: VisitOptions) => {
      // [number, objectVal]
      sb.emitPushInt(node, InternalObjectProperty.Map);
      // [obj]
      sb.emitHelper(node, innerOptions, sb.helpers.getInternalObjectProperty);
    };

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.Map);
    // [classVal, number, globalObjectVal]
    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createClass({
        ctor: (innerOptions) => {
          clear(innerOptions);
        },
        prototypeMethods: {
          clear: (innerOptions) => {
            clear(innerOptions);
            // [val]
            sb.emitHelper(node, innerOptions, sb.helpers.createUndefined);
          },
          delete: (innerOptions) => {
            // [argsarr]
            sb.emitPushInt(node, 0);
            // [key]
            sb.emitOp(node, 'PICKITEM');
            // [serialized]
            sb.emitHelper(node, innerOptions, sb.helpers.genericSerialize);
            // [keyBuffer]
            sb.emitSysCall(node, 'Neo.Runtime.Serialize');
            // [this, keyBuffer]
            sb.scope.getThis(sb, node, innerOptions);
            // [map, keyBuffer]
            getMap(innerOptions);
            // [map, keyBuffer, map]
            sb.emitOp(node, 'TUCK');
            // [keyBuffer, map, keyBuffer, map]
            sb.emitOp(node, 'OVER');
            // [hasKey, keyBuffer, map]
            sb.emitOp(node, 'HASKEY');
            // [map, hasKey, keyBuffer]
            sb.emitOp(node, 'ROT');
            // [keyBuffer, map, hasKey]
            sb.emitOp(node, 'ROT');
            // [hasKey]
            sb.emitOp(node, 'REMOVE');
            // [boolVal]
            sb.emitHelper(node, innerOptions, sb.helpers.createBoolean);
          },
          get: (innerOptions) => {
            // [argsarr]
            sb.emitPushInt(node, 0);
            // [key]
            sb.emitOp(node, 'PICKITEM');
            // [serialized]
            sb.emitHelper(node, innerOptions, sb.helpers.genericSerialize);
            // [keyBuffer]
            sb.emitSysCall(node, 'Neo.Runtime.Serialize');
            // [this, keyBuffer]
            sb.scope.getThis(sb, node, innerOptions);
            // [map, keyBuffer]
            getMap(innerOptions);
            // [map, keyBuffer, map]
            sb.emitOp(node, 'TUCK');
            // [keyBuffer, map, keyBuffer, map]
            sb.emitOp(node, 'OVER');
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [hasKey, keyBuffer, map]
                  sb.emitOp(node, 'HASKEY');
                },
                whenTrue: () => {
                  // [val]
                  sb.emitOp(node, 'PICKITEM');
                },
                whenFalse: () => {
                  // [map]
                  sb.emitOp(node, 'DROP');
                  // []
                  sb.emitOp(node, 'DROP');
                  // [undefinedVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.createUndefined);
                },
              }),
            );
          },
          set: (innerOptions) => {
            // [this, argsarr]
            sb.scope.getThis(sb, node, innerOptions);
            // [this, argsarr, this]
            sb.emitOp(node, 'TUCK');
            // [map, argsarr, this]
            getMap(innerOptions);
            // [argsarr, map, this]
            sb.emitOp(node, 'SWAP');
            // [length, keyVal, valueVal, map, this]
            sb.emitOp(node, 'UNPACK');
            // [keyVal, valueVal, map, this]
            sb.emitOp(node, 'DROP');
            // [serialized, valueVal, map, this]
            sb.emitHelper(node, innerOptions, sb.helpers.genericSerialize);
            // [buffer, valueVal, map, this]
            sb.emitSysCall(node, 'Neo.Runtime.Serialize');
            // [valueVal, buffer, map, this]
            sb.emitOp(node, 'SWAP');
            // [this]
            sb.emitOp(node, 'SETITEM');
          },
        },
      }),
    );
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.Map }));
  }
}
