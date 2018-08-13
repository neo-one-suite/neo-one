import { common } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { isAddress, isHash256, isPublicKey } from './buffer';

export interface WrapValRecursiveHelperOptions {
  readonly checkValue?: boolean;
  readonly type: ts.Type | undefined;
}

// Input: [val]
// Output: [value]
export class WrapValRecursiveHelper extends Helper {
  private readonly checkValue: boolean;
  private readonly type: ts.Type | undefined;
  public constructor(options: WrapValRecursiveHelperOptions) {
    super();
    this.checkValue = options.checkValue === undefined ? false : options.checkValue;
    this.type = options.type;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.type === undefined) {
      return;
    }

    const createHandleValue = (hasValue: boolean, body: (options: VisitOptions) => void) => (
      innerOptions: VisitOptions,
    ) => {
      if (!innerOptions.pushValue) {
        if (hasValue) {
          sb.emitOp(node, 'DROP');
        }

        return;
      }

      body(innerOptions);
    };

    const handleUndefined = createHandleValue(false, (innerOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
    });

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        single: true,
        singleUndefined: handleUndefined,
        array: createHandleValue(true, (innerOptions) => {
          const elements = this.type === undefined ? undefined : tsUtils.type_.getTupleElements(this.type);
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
                      type:
                        this.type === undefined
                          ? undefined
                          : sb.context.getNotAnyType(node, tsUtils.type_.getArrayType(this.type)),
                    }),
                  );
                },
              }),
            );
          } else {
            const tupleElements = elements.map((element) => {
              const constraintType = tsUtils.type_.getConstraint(element);

              return sb.context.getNotAnyType(node, constraintType === undefined ? element : constraintType, {
                error: true,
              });
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
        boolean: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
        }),
        buffer: createHandleValue(true, (innerOptions) => {
          const type = this.type;
          if (
            this.checkValue &&
            type !== undefined &&
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
          sb.emitHelper(node, innerOptions, sb.helpers.wrapObject);
        }),
        string: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapString);
        }),
        symbol: createHandleValue(true, (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.wrapSymbol);
        }),
        undefined: handleUndefined,
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
