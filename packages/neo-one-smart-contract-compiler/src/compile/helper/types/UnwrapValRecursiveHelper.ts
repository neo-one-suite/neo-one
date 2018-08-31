import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface UnwrapValRecursiveHelperOptions {
  readonly type: ts.Type | undefined;
}

// Input: [val]
// Output: [value]
export class UnwrapValRecursiveHelper extends Helper {
  private readonly type: ts.Type | undefined;
  public constructor(options: UnwrapValRecursiveHelperOptions) {
    super();
    this.type = options.type;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (this.type === undefined) {
      return;
    }

    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
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
                sb.emitHelper(
                  node,
                  innerInnerOptions,
                  sb.helpers.unwrapValRecursive({
                    type:
                      this.type === undefined
                        ? undefined
                        : sb.context.analysis.getNotAnyType(node, tsUtils.type_.getArrayTypeOrThrow(this.type)),
                  }),
                );
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
        object: (innerOptions) => {
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapObject);
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
          sb.emitOp(node, 'DROP');
          sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
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
