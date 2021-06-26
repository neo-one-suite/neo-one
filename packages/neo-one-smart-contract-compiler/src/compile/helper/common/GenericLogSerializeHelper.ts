import ts from 'typescript';
import { GlobalProperty, InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { invokeLogSerialize } from './serialize';

// Input: [val]
// Output: []
export class GenericLogSerializeHelper extends Helper {
  public readonly needsGlobal = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const doNothing = () => {
      // do nothing
    };

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    const handleArray = (innerOptions: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrMap({
          map: (innerInnerOptions) => {
            invokeLogSerialize(sb, node, innerInnerOptions);
          },
        }),
      );
      // [val]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
    };

    const handleMap = (innerOptions: VisitOptions) => {
      // [map]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapMap);
      // [arr, map]
      sb.emitOp(node, 'NEWARRAY0');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.mapReduce({
          deserializeKey: true,
          each: (innerInnerOptions) => {
            // [val, arr, key]
            sb.emitOp(node, 'ROT');
            // [val, arr, key]
            invokeLogSerialize(sb, node, innerInnerOptions);
            // [key, val, arr]
            sb.emitOp(node, 'ROT');
            // [key, val, arr]
            invokeLogSerialize(sb, node, innerInnerOptions);
            // [2, key, val, arr]
            sb.emitPushInt(node, 2);
            // [entryArr, arr]
            sb.emitOp(node, 'PACK');
            // [arr, entryArr, arr]
            sb.emitOp(node, 'OVER');
            // [entryArr, arr, arr]
            sb.emitOp(node, 'SWAP');
            // [arr]
            sb.emitOp(node, 'APPEND');
          },
        }),
      );
      // [val]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapMap);
    };

    const handleSet = (innerOptions: VisitOptions) => {
      // [map]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapSet);
      // [arr, map]
      sb.emitOp(node, 'NEWARRAY0');
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.mapReduce({
          deserializeKey: true,
          each: (innerInnerOptions) => {
            // [val, arr, key]
            sb.emitOp(node, 'ROT');
            // [arr, key]
            sb.emitOp(node, 'DROP');
            // [arr, key, arr]
            sb.emitOp(node, 'TUCK');
            // [key, arr, arr]
            sb.emitOp(node, 'SWAP');
            // [key, arr, arr]
            invokeLogSerialize(sb, node, innerInnerOptions);
            // [arr]
            sb.emitOp(node, 'APPEND');
          },
        }),
      );
      // [val]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapSet);
    };

    const handleObject = (innerOptions: VisitOptions) => {
      // [val, val]
      sb.emitOp(node, 'DUP');
      // [values, val]
      sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectValues);
      // [values, val]
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrMap({
          map: (innerInnerOptions) => {
            // [val]
            invokeLogSerialize(sb, node, innerInnerOptions);
          },
        }),
      );
      // [val, values]
      sb.emitOp(node, 'SWAP');
      // [keys, values]
      sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectKeys);
      // [keys, values]
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrMap({
          map: (innerInnerOptions) => {
            // [val]
            sb.emitHelper(node, innerInnerOptions, sb.helpers.wrapString);
          },
        }),
      );
      // [2, keys, values]
      sb.emitPushInt(node, 2);
      // [arr]
      sb.emitOp(node, 'PACK');
      // [val]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapObject);
    };

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.GenericLogSerialize);
    // [farr, number, globalObject]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // [0, argsarr]
          sb.emitPushInt(node, 0);
          // [val]
          sb.emitOp(node, 'PICKITEM');
          // [val]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.forBuiltinType({
              type: undefined,
              array: handleArray,
              arrayStorage: throwTypeError,
              boolean: doNothing,
              buffer: doNothing,
              null: doNothing,
              number: doNothing,
              object: handleObject,
              string: doNothing,
              symbol: doNothing,
              undefined: doNothing,
              map: handleMap,
              mapStorage: throwTypeError,
              set: handleSet,
              setStorage: throwTypeError,
              error: throwTypeError,
              forwardValue: throwTypeError,
              iteratorResult: throwTypeError,
              iterable: throwTypeError,
              iterableIterator: throwTypeError,
              transaction: throwTypeError,
              attribute: throwTypeError,
              contract: throwTypeError,
              block: throwTypeError,
              contractManifest: throwTypeError,
              contractABI: throwTypeError,
              contractMethod: throwTypeError,
              contractEvent: throwTypeError,
              contractParameter: throwTypeError,
              contractGroup: throwTypeError,
              contractPermission: throwTypeError,
              transfer: throwTypeError,
            }),
          );
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.return);
        },
      }),
    );
    // [objectVal, number, globalObject]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalObjectProperty.Call,
      }),
    );
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    invokeLogSerialize(sb, node, options);
  }
}
