import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper, TypedHelperOptions } from '../TypedHelper';

export interface ToStringHelperOptions extends TypedHelperOptions {
  readonly initial?: boolean;
}

// Input: [val]
// Output: [string]
export class ToStringHelper extends TypedHelper {
  private readonly initial: boolean;

  public constructor({ initial = true, type, knownType }: ToStringHelperOptions) {
    super({ type, knownType });

    this.initial = initial;
  }
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const convertUndefined = () => {
      sb.emitOp(node, 'DROP');
      sb.emitPushString(node, 'undefined');
    };

    const convertNull = () => {
      sb.emitOp(node, 'DROP');
      sb.emitPushString(node, 'null');
    };

    const convertBoolean = (options: VisitOptions) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
          },
          whenTrue: () => {
            sb.emitPushString(node, 'true');
          },
          whenFalse: () => {
            sb.emitPushString(node, 'false');
          },
        }),
      );
    };

    const convertNumber = (options: VisitOptions) => {
      const n = sb.scope.addUnique();
      const accum = sb.scope.addUnique();

      // [number]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [number, number]
            sb.emitOp(node, 'DUP');
            // [0, number, number]
            sb.emitPushInt(node, 0);
            // [number === 0, number]
            sb.emitOp(node, 'NUMEQUAL');
          },
          whenTrue: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [string]
            sb.emitPushString(node, '0');
          },
          whenFalse: () => {
            // []
            sb.scope.set(sb, node, options, n);
            // [buffer]
            sb.emitPushBuffer(node, Buffer.from([]));
            // []
            sb.scope.set(sb, node, options, accum);
            sb.emitHelper(
              node,
              options,
              sb.helpers.forLoop({
                condition: () => {
                  // [n]
                  sb.scope.get(sb, node, options, n);
                  // [0, n]
                  sb.emitPushInt(node, 0);
                  // [n > 0]
                  sb.emitOp(node, 'GT');
                },
                each: () => {
                  // [n]
                  sb.scope.get(sb, node, options, n);
                  // [n, n]
                  sb.emitOp(node, 'DUP');
                  // [10, n, n]
                  sb.emitPushInt(node, 10);
                  // [n / 10, n]
                  sb.emitOp(node, 'DIV');
                  // [n]
                  sb.scope.set(sb, node, options, n);
                  // [10, n]
                  sb.emitPushInt(node, 10);
                  // [n % 10]
                  sb.emitOp(node, 'MOD');
                  // [0x30, n % 10]
                  sb.emitPushInt(node, 0x30);
                  // [number]
                  sb.emitOp(node, 'ADD');
                  // [accum, number]
                  sb.scope.get(sb, node, options, accum);
                  // [number + accum]
                  sb.emitOp(node, 'CAT');
                  // []
                  sb.scope.set(sb, node, options, accum);
                },
                cleanup: () => {
                  // do nothing
                },
              }),
            );
            // [string]
            sb.scope.get(sb, node, options, accum);
          },
        }),
      );
    };

    const convertString = (options: VisitOptions) => {
      // [string]
      sb.emitHelper(node, options, sb.helpers.unwrapString);
    };

    const throwTypeError = (options: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, options, sb.helpers.throwTypeError);
    };

    const convertObject = (options: VisitOptions): void => {
      // [primitive]
      sb.emitHelper(node, options, sb.helpers.toPrimitive({ type: this.type, preferredType: 'string' }));
      // [string]
      doConvert(options, false);
    };

    const convertArray = (options: VisitOptions) => {
      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [string]
      sb.emitHelper(node, options, sb.helpers.arrToString({ type: this.type, knownType: Types.Array }));
    };

    const convertEmptyString = () => {
      // []
      sb.emitOp(node, 'DROP');
      // [string]
      sb.emitPushString(node, '');
    };

    const convertBuffer = (innerOptions: VisitOptions) => {
      // [buffer]
      sb.emitHelper(node, innerOptions, sb.helpers.unwrapBuffer);
    };

    const doConvert = (options: VisitOptions, initial: boolean) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.forBuiltinType({
          type: initial ? this.type : undefined,
          knownType: initial ? this.knownType : undefined,
          array: initial ? convertArray : throwTypeError,
          arrayStorage: convertEmptyString,
          boolean: convertBoolean,
          buffer: convertBuffer,
          null: convertNull,
          number: convertNumber,
          object: initial ? convertObject : throwTypeError,
          string: convertString,
          symbol: throwTypeError,
          undefined: convertUndefined,
          map: convertEmptyString,
          mapStorage: convertEmptyString,
          set: convertEmptyString,
          setStorage: convertEmptyString,
          error: convertEmptyString,
          forwardValue: convertEmptyString,
          iteratorResult: convertEmptyString,
          iterable: convertEmptyString,
          iterableIterator: convertEmptyString,
          transaction: convertEmptyString,
          attribute: convertEmptyString,
          contract: convertEmptyString,
          block: convertEmptyString,
        }),
      );
    };

    doConvert(optionsIn, this.initial);
  }
}
