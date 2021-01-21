import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { isOnlyMap } from './map';

export interface UnwrapValRecursiveHelperOptions {
  readonly deserializeBeforeUnwrap?: boolean;
  readonly type: ts.Type | undefined;
}

// Input: [val]
// Output: [value]
export class UnwrapValRecursiveHelper extends Helper {
  private readonly deserializeBeforeUnwrap: boolean;
  private readonly type: ts.Type | undefined;
  public constructor(options: UnwrapValRecursiveHelperOptions) {
    super();
    this.type = options.type;
    this.deserializeBeforeUnwrap = options.deserializeBeforeUnwrap ?? false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.type === undefined) {
      return;
    }

    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
    }

    const type = tsUtils.type_.getNonNullableType(this.type);

    if (this.deserializeBeforeUnwrap) {
      sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
    }
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        array: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapArray);
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.arrMap({
              map: (innerInnerOptions) => {
                const localArrayType = tsUtils.type_.getArrayType(type);
                const arrayType =
                  localArrayType === undefined ? undefined : sb.context.analysis.getNotAnyType(node, localArrayType);
                sb.emitHelper(node, innerInnerOptions, sb.helpers.unwrapValRecursive({ type: arrayType }));
              },
            }),
          );
        },
        arrayStorage: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        boolean: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapBoolean);
        },
        buffer: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapBuffer);
        },
        null: () => {
          sb.emitOp(node, 'DROP');
          sb.emitPushBuffer(node, Buffer.from([]));
        },
        number: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapNumber);
        },
        // We only ever use unwrapValRecursive in cases where typescript has already verified for us
        // that it's an object with string properties and unwrappable values, so we don't do any additional
        // checks here.
        object: (innerOptions) => {
          // [outputMap, objectVal]
          sb.emitOp(node, 'NEWMAP');
          tsUtils.type_.getProperties(type).forEach((prop) => {
            const propType = sb.context.analysis.getTypeOfSymbol(prop, node);
            // [outputMap, objectVal, outputMap]
            sb.emitOp(node, 'TUCK');
            // [objectVal, outputMap, objectVal, outputMap]
            sb.emitOp(node, 'OVER');
            // [string, objectVal, outputMap, objectVal, outputMap]
            sb.emitPushString(node, tsUtils.symbol.getName(prop));
            // [string, objectVal, string, outputMap, objectVal, outputMap]
            sb.emitOp(node, 'TUCK');
            // [val, string, outputMap, objectVal, outputMap]
            sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectProperty);
            // [value, string, outputMap, objectVal, outputMap]
            sb.emitHelper(node, innerOptions, sb.helpers.unwrapValRecursive({ type: propType }));
            // [objectVal, outputMap]
            sb.emitOp(node, 'SETITEM');
            // [outputMap, objectVal]
            sb.emitOp(node, 'SWAP');
          });
          // [outputMap]
          sb.emitOp(node, 'NIP');
        },
        string: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapString);
        },
        symbol: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapSymbol);
        },
        undefined: () => {
          sb.emitOp(node, 'DROP');
          sb.emitPushBuffer(node, Buffer.from([]));
        },
        map: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapMap);
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.mapMap({
              map: (innerInnerOptions) => {
                let keyType: ts.Type | undefined;
                let valueType: ts.Type | undefined;
                if (isOnlyMap(sb.context, node, type)) {
                  const localKeyType = tsUtils.type_.getTypeArgumentsArray(type)[0] as ts.Type | undefined;
                  keyType =
                    localKeyType === undefined ? undefined : sb.context.analysis.getNotAnyType(node, localKeyType);
                  const localValueType = tsUtils.type_.getTypeArgumentsArray(type)[1] as ts.Type | undefined;
                  valueType =
                    localValueType === undefined ? undefined : sb.context.analysis.getNotAnyType(node, localValueType);
                }

                sb.emitHelper(
                  node,
                  innerInnerOptions,
                  sb.helpers.unwrapValRecursive({ deserializeBeforeUnwrap: true, type: keyType }),
                );
                sb.emitOp(node, 'SWAP');
                sb.emitHelper(node, innerInnerOptions, sb.helpers.unwrapValRecursive({ type: valueType }));
                sb.emitOp(node, 'SWAP');
              },
            }),
          );
        },
        mapStorage: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        set: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        setStorage: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        error: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        forwardValue: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapForwardValue);
        },
        iteratorResult: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        iterableIterator: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        iterable: (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        },
        transaction: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapTransaction);
        },
        output: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapOutput);
        },
        attribute: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapAttribute);
        },
        input: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapInput);
        },
        account: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapAccount);
        },
        asset: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapAsset);
        },
        contract: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapContract);
        },
        header: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapHeader);
        },
        block: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapBlock);
        },
      }),
    );
  }
}
