import ts from 'typescript';
import { WellKnownSymbol } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Types } from './Types';

export type PreferredType = 'default' | 'string' | 'number';
export interface ToPrimitiveHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
  readonly preferredType?: PreferredType;
}

// NOTE: Unlike the other To* methods, this returns a wrapped value.
// Input: [val]
// Output: [val]
export class ToPrimitiveHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly knownType: Types | undefined;
  private readonly preferredType: PreferredType;

  public constructor({ type, knownType, preferredType = 'default' }: ToPrimitiveHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
    this.preferredType = preferredType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const throwTypeError = (options: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, options, sb.helpers.throwTypeError);
    };

    const convertArray = (options: VisitOptions) => {
      sb.emitHelper(node, options, sb.helpers.toString({ type: this.type, knownType: Types.Array }));
      sb.emitHelper(node, options, sb.helpers.createString);
    };

    const convertPrimitive = () => {
      // do nothing
    };

    const convertBuffer = (options: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitPushString(node, '');
      sb.emitHelper(node, options, sb.helpers.createString);
    };

    const convertObject = (options: VisitOptions) => {
      const convertObjectDone = () => {
        // [val]
        sb.emitOp(node, 'NIP');
      };

      const tryConvert = () => {
        const methods = this.preferredType === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
        const convert = (innerOptions: VisitOptions) => {
          // [func, value]
          sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObjectProperty);
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [func, func, value]
                sb.emitOp(node, 'DUP');
                // [isUndefined, func, value]
                sb.emitHelper(node, innerOptions, sb.helpers.isUndefined);
              },
              whenTrue: () => {
                // [value]
                sb.emitOp(node, 'DROP');
              },
              whenFalse: () => {
                sb.emitHelper(node, innerOptions, sb.helpers.invokeCall({ bindThis: true, noArgs: true }));
              },
            }),
          );
        };

        const nextConvertObject = (innerOptions: VisitOptions) => {
          // [val]
          sb.emitOp(node, 'DROP');
          // [val, val]
          sb.emitOp(node, 'DUP');
          // [method, val, val]
          sb.emitPushString(node, methods[1]);
          // [convertedVal]
          convert(innerOptions);

          sb.emitHelper(
            node,
            optionsIn,
            sb.helpers.forBuiltinType({
              type: undefined,
              knownType: undefined,
              array: throwTypeError,
              boolean: convertPrimitive,
              buffer: throwTypeError,
              null: convertPrimitive,
              number: convertPrimitive,
              object: throwTypeError,
              string: convertPrimitive,
              symbol: convertPrimitive,
              undefined: convertPrimitive,
            }),
          );
        };

        // [val, val]
        sb.emitOp(node, 'DUP');
        // [val, val, val]
        sb.emitOp(node, 'DUP');
        // [method, val, val]
        sb.emitPushString(node, methods[0]);
        // [convertedVal, val]
        convert(optionsIn);

        sb.emitHelper(
          node,
          optionsIn,
          sb.helpers.forBuiltinType({
            type: undefined,
            knownType: undefined,
            array: nextConvertObject,
            boolean: convertObjectDone,
            buffer: nextConvertObject,
            null: convertObjectDone,
            number: convertObjectDone,
            object: nextConvertObject,
            string: convertObjectDone,
            symbol: convertObjectDone,
            undefined: convertObjectDone,
          }),
        );
      };

      // [value, value]
      sb.emitOp(node, 'DUP');
      // [symbol, value, value]
      sb.emitPushString(node, WellKnownSymbol.toPrimitive);
      // [toPrimitive, value]
      sb.emitHelper(node, options, sb.helpers.getSymbolObjectProperty);
      // [val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [toPrimitive, toPrimitive, value]
            sb.emitOp(node, 'DUP');
            // [isUndefined, toPrimitive, value]
            sb.emitHelper(node, options, sb.helpers.isUndefined);
          },
          whenTrue: () => {
            // [value]
            sb.emitOp(node, 'DROP');
            // [value]
            tryConvert();
          },
          whenFalse: () => {
            // [preferredType, toPrimitiveVal, val]
            sb.emitPushString(node, this.preferredType);
            // [1, preferredType, toPrimitiveVal, val]
            sb.emitPushInt(node, 1);
            // [args, toPrimitiveVal, val]
            sb.emitOp(node, 'PACK');
            // [val, args, toPrimitiveVal]
            sb.emitOp(node, 'ROT');
            // [toPrimitiveVal, val, args]
            sb.emitOp(node, 'ROT');
            // [val]
            sb.emitHelper(node, options, sb.helpers.invokeCall({ bindThis: true }));
          },
        }),
      );
    };

    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: convertArray,
        boolean: convertPrimitive,
        buffer: convertBuffer,
        null: convertPrimitive,
        number: convertPrimitive,
        object: convertObject,
        string: convertPrimitive,
        symbol: convertPrimitive,
        undefined: convertPrimitive,
      }),
    );
  }
}
