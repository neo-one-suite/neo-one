import { common } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { isAddress, isHash256, isPublicKey } from './buffer';
import { isOnlyMap } from './map';

export interface WrapValRecursiveHelperOptions {
  readonly serializeFinalVal?: boolean;
  readonly checkValue?: boolean;
  readonly type: ts.Type | undefined;
  readonly optional?: boolean;
}

// Input: [val]
// Output: [value]
export class WrapValRecursiveHelper extends Helper {
  private readonly serializeFinalVal: boolean;
  private readonly checkValue: boolean;
  private readonly type: ts.Type | undefined;
  private readonly optional?: boolean;

  public constructor(options: WrapValRecursiveHelperOptions) {
    super();
    this.checkValue = options.checkValue === undefined ? false : options.checkValue;
    this.type = options.type;
    this.optional = options.optional;
    this.serializeFinalVal = options.serializeFinalVal || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.type === undefined) {
      return;
    }

    const createHandleValue =
      (hasValue: boolean, body: (options: VisitOptions) => void) => (innerOptions: VisitOptions) => {
        if (!innerOptions.pushValue) {
          if (hasValue) {
            sb.emitOp(node, 'DROP');
          }

          return;
        }

        body(innerOptions);
        if (this.serializeFinalVal) {
          sb.emitSysCall(node, 'Neo.Runtime.Serialize');
        }
      };

    const handleUndefined = createHandleValue(false, (innerOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
    });

    const handleBoolean = createHandleValue(true, (innerOptions) => {
      sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
    });

    const type = tsUtils.type_.getNonNullableType(this.type);

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        single: true,
        singleUndefined: handleUndefined,
        singleFalse: handleBoolean,
        optional: this.optional,
        array: createHandleValue(true, (innerOptions) => {
          const elements = tsUtils.type_.getTupleElements(type);
          if (elements === undefined) {
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.arrMap({
                map: (innerInnerOptions) => {
                  sb.emitHelper(
                    node,
                    innerInnerOptions,
                    sb.helpers.wrapValRecursive({
                      checkValue: this.checkValue,
                      type: sb.context.analysis.getNotAnyType(node, tsUtils.type_.getArrayType(type)),
                    }),
                  );
                },
              }),
            );
          } else {
            const tupleElements = elements.map((element) => {
              const constraintType = tsUtils.type_.getConstraint(element);

              return sb.context.analysis.getNotAnyType(node, constraintType === undefined ? element : constraintType);
            });
            _.reverse([...tupleElements]).forEach((element, idx) => {
              // [arr, arr]
              sb.emitOp(node, 'DUP');
              // [idx, arr, arr]
              sb.emitPushInt(node, elements.length - idx - 1);
              // [value, arr]
              sb.emitOp(node, 'PICKITEM');
              // [val, arr]
              sb.emitHelper(
                node,
                innerOptions,
                sb.helpers.wrapValRecursive({ checkValue: this.checkValue, type: element }),
              );
              // [arr, val]
              sb.emitOp(node, 'SWAP');
            });
            // [...val]
            sb.emitOp(node, 'DROP');
            // [number, ...val]
            sb.emitPushInt(node, elements.length);
            // [arr]
            sb.emitOp(node, 'PACK');
          }
          sb.emitHelper(node, innerOptions, sb.helpers.wrapArray);
        }),
        arrayStorage: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        boolean: handleBoolean,
        buffer: createHandleValue(true, (innerOptions) => {
          if (
            this.checkValue &&
            (isAddress(sb.context, node, type) ||
              isHash256(sb.context, node, type) ||
              isPublicKey(sb.context, node, type))
          ) {
            // [buffer, buffer]
            sb.emitOp(node, 'DUP');
            // [size, buffer]
            sb.emitOp(node, 'SIZE');
            // [buffer]
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  const expectedSize = isAddress(sb.context, node, type)
                    ? common.UINT160_BUFFER_BYTES
                    : isHash256(sb.context, node, type)
                    ? common.UINT256_BUFFER_BYTES
                    : common.ECPOINT_BUFFER_BYTES;
                  // [number, number, buffer]
                  sb.emitPushInt(node, expectedSize);
                  // [boolean, buffer]
                  sb.emitOp(node, 'NUMEQUAL');
                },
                whenFalse: () => {
                  sb.emitOp(node, 'DROP');
                  sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
                },
              }),
            );
          }
          sb.emitHelper(node, innerOptions, sb.helpers.wrapBuffer);
        }),
        null: createHandleValue(false, (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.wrapNull);
        }),
        number: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapNumber);
        }),
        object: createHandleValue(true, (innerOptions) => {
          // [objectVal, map]
          sb.emitHelper(node, options, sb.helpers.createObject);
          tsUtils.type_.getProperties(type).forEach((prop) => {
            const propType = sb.context.analysis.getTypeOfSymbol(prop, node);
            // [objectVal, map, objectVal]
            sb.emitOp(node, 'TUCK');
            // [map, objectVal, map, objectVal]
            sb.emitOp(node, 'OVER');
            // [string, map, objectVal, map, objectVal]
            sb.emitPushString(node, tsUtils.symbol.getName(prop));
            // [map, string, map, objectVal, map, objectVal]
            sb.emitOp(node, 'OVER');
            // [string, map, string, map, objectVal, map, objectVal]
            sb.emitOp(node, 'OVER');
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [boolean, string, map, objectVal, map, objectVal]
                  sb.emitOp(node, 'HASKEY');
                },
                whenTrue: () => {
                  // [value, objectVal, map, objectVal]
                  sb.emitOp(node, 'PICKITEM');
                  // [val, objectVal, map, objectVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapValRecursive({ type: propType }));
                },
                whenFalse: () => {
                  // [map, objectVal, map, objectVal]
                  sb.emitOp(node, 'DROP');
                  // [objectVal, map, objectVal]
                  sb.emitOp(node, 'DROP');
                  // [val, objectVal, map, objectVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
                },
              }),
            );
            // [string, val, objectVal, map, objectVal]
            sb.emitPushString(node, tsUtils.symbol.getName(prop));
            // [val, string, objectVal, map, objectVal]
            sb.emitOp(node, 'SWAP');
            // [map, objectVal]
            sb.emitHelper(node, innerOptions, sb.helpers.setDataPropertyObjectProperty);
            // [objectVal, map]
            sb.emitOp(node, 'SWAP');
          });
          // [objectVal]
          sb.emitOp(node, 'NIP');
        }),
        string: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapString);
        }),
        symbol: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapSymbol);
        }),
        undefined: handleUndefined,
        map: createHandleValue(true, (innerOptions) => {
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
                  sb.helpers.wrapValRecursive({
                    serializeFinalVal: true,
                    checkValue: this.checkValue,
                    type: keyType,
                  }),
                );
                sb.emitOp(node, 'SWAP');
                sb.emitHelper(
                  node,
                  innerInnerOptions,
                  sb.helpers.wrapValRecursive({
                    checkValue: this.checkValue,
                    type: valueType,
                  }),
                );
                sb.emitOp(node, 'SWAP');
              },
            }),
          );
          sb.emitHelper(node, innerOptions, sb.helpers.wrapMap);
        }),
        mapStorage: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        set: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        setStorage: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        error: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        forwardValue: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapForwardValue);
        }),
        iteratorResult: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        iterable: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        iterableIterator: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
        }),
        transaction: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapTransaction);
        }),
        output: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapOutput);
        }),
        attribute: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapAttribute);
        }),
        input: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapInput);
        }),
        account: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapAccount);
        }),
        asset: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapAsset);
        }),
        contract: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapContract);
        }),
        header: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapHeader);
        }),
        block: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapBlock);
        }),
      }),
    );
  }
}
