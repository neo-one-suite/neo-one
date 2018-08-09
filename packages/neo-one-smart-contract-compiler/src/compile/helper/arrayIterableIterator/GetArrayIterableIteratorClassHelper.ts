import ts from 'typescript';
import { GlobalProperty, InternalObjectProperty, WellKnownSymbol } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [val]
export class GetArrayIterableIteratorClassHelper extends Helper {
  public readonly needsGlobal: boolean = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const outerOptions = sb.pushValueOptions(optionsIn);

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.ArrayIterableIterator);
    // [classVal, number, globalObjectVal]
    sb.emitHelper(
      node,
      outerOptions,
      sb.helpers.createClass({
        ctor: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // [0, argsarr]
          sb.emitPushInt(node, 0);
          // [arrayVal]
          sb.emitOp(node, 'PICKITEM');
          // [thisObjectVal, val]
          sb.scope.getThis(sb, node, innerOptions);
          // [thisObjectVal, val, thisObjectVal]
          sb.emitOp(node, 'TUCK');
          // [number, thisObjectVal, val, thisObjectVal]
          sb.emitPushInt(node, InternalObjectProperty.Data0);
          // [val, number, thisObjectVal, thisObjectVal]
          sb.emitOp(node, 'ROT');
          // [thisObjectVal]
          sb.emitHelper(node, innerOptions, sb.helpers.setInternalObjectProperty);
          // [number, thisObjectVal]
          sb.emitPushInt(node, InternalObjectProperty.Data1);
          // [idx, number, thisObjectVal]
          sb.emitPushInt(node, 0);
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.setInternalObjectProperty);
        },
        prototypeMethods: {
          next: (innerOptions) => {
            // [thisObjectVal]
            sb.scope.getThis(sb, node, innerOptions);
            // [thisObjectVal, thisObjectVal]
            sb.emitOp(node, 'DUP');
            // [thisObjectVal, thisObjectVal, thisObjectVal]
            sb.emitOp(node, 'DUP');
            // [number, thisObjectVal, thisObjectVal, thisObjectVal]
            sb.emitPushInt(node, InternalObjectProperty.Data1);
            // [idx, thisObjectVal, thisObjectVal]
            sb.emitHelper(node, innerOptions, sb.helpers.getInternalObjectProperty);
            // [idx, thisObjectVal, idx, thisObjectVal]
            sb.emitOp(node, 'TUCK');
            // [idx + 1, thisObjectVal, idx, thisObjectVal]
            sb.emitOp(node, 'INC');
            // [number, idx + 1, thisObjectVal, idx, thisObjectVal]
            sb.emitPushInt(node, InternalObjectProperty.Data1);
            // [idx + 1, number, thisObjectVal, idx, thisObjectVal]
            sb.emitOp(node, 'SWAP');
            // [idx, thisObjectVal]
            sb.emitHelper(node, innerOptions, sb.helpers.setInternalObjectProperty);
            // [thisObjectVal, idx]
            sb.emitOp(node, 'SWAP');
            // [number, thisObjectVal, idx]
            sb.emitPushInt(node, InternalObjectProperty.Data0);
            // [arrayVal, idx]
            sb.emitHelper(node, innerOptions, sb.helpers.getInternalObjectProperty);
            // [arrayVal, idx, arrayVal]
            sb.emitOp(node, 'TUCK');
            // [length, idx, arrayVal]
            sb.emitHelper(node, innerOptions, sb.helpers.arrayLength);
            // [idx, length, idx, arrayVal]
            sb.emitOp(node, 'OVER');
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [length <= idx, idx, arrayVal]
                  sb.emitOp(node, 'LTE');
                },
                whenTrue: () => {
                  // [arrayVal]
                  sb.emitOp(node, 'DROP');
                  // []
                  sb.emitOp(node, 'DROP');
                  // [val]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
                  // [done, val]
                  sb.emitPushBoolean(node, true);
                  // [done, val]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                },
                whenFalse: () => {
                  // [arrayVal, idx]
                  sb.emitOp(node, 'SWAP');
                  // [arr, idx]
                  sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
                  // [idx, arr]
                  sb.emitOp(node, 'SWAP');
                  // [val]
                  sb.emitOp(node, 'PICKITEM');
                  // [done, val]
                  sb.emitPushBoolean(node, false);
                  // [done, val]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                },
              }),
            );
            // [objectVal, done, val]
            sb.emitHelper(node, innerOptions, sb.helpers.createObject);
            // [objectVal, done, objectVal, val]
            sb.emitOp(node, 'TUCK');
            // ['done', objectVal, done, objectVal, val]
            sb.emitPushString(node, 'done');
            // [done, 'done', objectVal, objectVal, val]
            sb.emitOp(node, 'ROT');
            // [objectVal, val]
            sb.emitHelper(node, innerOptions, sb.helpers.setDataPropertyObjectProperty);
            // [objectVal, val, objectVal]
            sb.emitOp(node, 'TUCK');
            // ['value', objectVal, val, objectVal]
            sb.emitPushString(node, 'value');
            // [val, 'value', objectVal, objectVal]
            sb.emitOp(node, 'ROT');
            // [objectVal]
            sb.emitHelper(node, innerOptions, sb.helpers.setDataPropertyObjectProperty);
          },
        },
        prototypeSymbolMethods: {
          [WellKnownSymbol.iterator]: (innerOptions) => {
            // [thisObjectVal]
            sb.scope.getThis(sb, node, innerOptions);
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
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.ArrayIterableIterator }));
  }
}
