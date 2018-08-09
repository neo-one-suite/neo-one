import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface WrapValRecursiveHelperOptions {
  readonly type: ts.Type | undefined;
}

// Input: [val]
// Output: [value]
export class WrapValRecursiveHelper extends Helper {
  private readonly type: ts.Type | undefined;
  public constructor(options: WrapValRecursiveHelperOptions) {
    super();
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

    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        single: true,
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
              sb.emitHelper(node, innerOptions, sb.helpers.wrapValRecursive({ type: element }));
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
        undefined: createHandleValue(false, (innerOptions) => {
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
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
