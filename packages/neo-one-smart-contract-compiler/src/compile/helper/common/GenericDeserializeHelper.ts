import ts from 'typescript';
import { GlobalProperty, InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { invokeDeserialize } from './serialize';

// Input: [val]
// Output: []
export class GenericDeserializeHelper extends Helper {
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

    const deserializeArray = (innerOptions: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
      // [arr]
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrMap({
          map: () => {
            invokeDeserialize(sb, node, innerOptions);
          },
        }),
      );
      // [arrayVal]
      sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
    };

    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.GenericDeserialize);
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
              array: deserializeArray,
              boolean: doNothing,
              buffer: doNothing,
              null: doNothing,
              number: doNothing,
              object: throwTypeError,
              string: doNothing,
              symbol: doNothing,
              undefined: doNothing,
              transaction: throwTypeError,
              output: throwTypeError,
              attribute: throwTypeError,
              input: throwTypeError,
              account: throwTypeError,
              asset: throwTypeError,
              contract: throwTypeError,
              header: throwTypeError,
              block: throwTypeError,
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

    invokeDeserialize(sb, node, options);
  }
}
