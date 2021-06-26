import ts from 'typescript';
import { Types, WellKnownSymbol } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

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

    const throwInnerTypeError = (options: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      throwTypeError(options);
    };

    const convertPrimitive = () => {
      // do nothing
    };

    const convertBuffer = (options: VisitOptions) => {
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapString);
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
              arrayStorage: throwTypeError,
              boolean: convertPrimitive,
              buffer: throwTypeError,
              null: convertPrimitive,
              number: convertPrimitive,
              object: throwTypeError,
              string: convertPrimitive,
              symbol: convertPrimitive,
              undefined: convertPrimitive,
              map: throwTypeError,
              mapStorage: throwTypeError,
              set: throwTypeError,
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
            arrayStorage: throwInnerTypeError,
            boolean: convertObjectDone,
            buffer: nextConvertObject,
            null: convertObjectDone,
            number: convertObjectDone,
            object: nextConvertObject,
            string: convertObjectDone,
            symbol: convertObjectDone,
            undefined: convertObjectDone,
            map: throwInnerTypeError,
            mapStorage: throwInnerTypeError,
            set: throwInnerTypeError,
            setStorage: throwInnerTypeError,
            error: throwInnerTypeError,
            forwardValue: throwInnerTypeError,
            iteratorResult: throwInnerTypeError,
            iterable: throwInnerTypeError,
            iterableIterator: throwInnerTypeError,
            transaction: throwInnerTypeError,
            attribute: throwInnerTypeError,
            contract: throwInnerTypeError,
            block: throwInnerTypeError,
            contractManifest: throwInnerTypeError,
            contractABI: throwInnerTypeError,
            contractMethod: throwInnerTypeError,
            contractEvent: throwInnerTypeError,
            contractParameter: throwInnerTypeError,
            contractGroup: throwInnerTypeError,
            contractPermission: throwInnerTypeError,
            transfer: throwInnerTypeError,
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

    const toString = (knownType: Types) => (options: VisitOptions) => {
      // [string]
      sb.emitHelper(node, options, sb.helpers.toString({ type: this.type, knownType }));
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapString);
    };

    sb.emitHelper(
      node,
      optionsIn,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: toString(Types.Array),
        arrayStorage: toString(Types.Array),
        boolean: convertPrimitive,
        buffer: convertBuffer,
        null: convertPrimitive,
        number: convertPrimitive,
        object: convertObject,
        string: convertPrimitive,
        symbol: convertPrimitive,
        undefined: convertPrimitive,
        map: toString(Types.Array),
        mapStorage: toString(Types.Array),
        set: toString(Types.Array),
        setStorage: toString(Types.Array),
        error: toString(Types.Error),
        forwardValue: toString(Types.ForwardValue),
        iteratorResult: toString(Types.IteratorResult),
        iterable: toString(Types.Iterable),
        iterableIterator: toString(Types.IterableIterator),
        transaction: toString(Types.Transaction),
        attribute: toString(Types.Attribute),
        contract: toString(Types.Contract),
        block: toString(Types.Block),
        contractManifest: toString(Types.ContractManifest),
        contractABI: toString(Types.ContractABI),
        contractMethod: toString(Types.ContractMethod),
        contractEvent: toString(Types.ContractEvent),
        contractParameter: toString(Types.ContractParameter),
        contractGroup: toString(Types.ContractGroup),
        contractPermission: toString(Types.ContractPermission),
        transfer: toString(Types.Transfer),
      }),
    );
  }
}
