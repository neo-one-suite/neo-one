import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../../common';

// Input: [val]
// Output: [string]
export class ToStringHelper extends TypedHelper {
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
            sb.emitHelper(node, options, sb.helpers.getBoolean);
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
      sb.emitHelper(node, options, sb.helpers.getNumber);
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
      sb.emitHelper(node, options, sb.helpers.getString);
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
      const types = this.type === undefined ? [] : tsUtils.type_.getArrayTypes(this.type);
      const type = types.length === 1 ? tsUtils.type_.getArrayType(types[0]) : undefined;
      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [accum, arr]
      sb.emitPushString(node, '');
      // [accum]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrReduce({
          withIndex: true,
          each: (innerOptions) => {
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [idx, accum, val]
                  sb.emitOp(node, 'ROT');
                  // [0, idx, accum, val]
                  sb.emitPushInt(node, 0);
                  // [idx === 0, accum, val]
                  sb.emitOp(node, 'NUMEQUAL');
                },
                whenTrue: () => {
                  // [val]
                  sb.emitOp(node, 'DROP');
                  if (type === undefined) {
                    // [accum]
                    doConvert(innerOptions, false);
                  } else {
                    // [accum]
                    sb.emitHelper(node, innerOptions, sb.helpers.toString({ type }));
                  }
                },
                whenFalse: () => {
                  // [string, accum, val]
                  sb.emitPushString(node, ',');
                  // [accum, val]
                  sb.emitOp(node, 'CAT');
                  // [val, accum]
                  sb.emitOp(node, 'SWAP');
                  if (type === undefined) {
                    // [string, accum]
                    doConvert(innerOptions, false);
                  } else {
                    // [string, accum]
                    sb.emitHelper(node, innerOptions, sb.helpers.toString({ type }));
                  }
                  // [accum]
                  sb.emitOp(node, 'CAT');
                },
              }),
            );
          },
        }),
      );
    };

    const convertBuffer = () => {
      // []
      sb.emitOp(node, 'DROP');
      // [string]
      sb.emitPushString(node, '');
    };

    const doConvert = (options: VisitOptions, initial = true) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.forBuiltinType({
          type: initial ? this.type : undefined,
          knownType: initial ? this.knownType : undefined,
          array: initial ? convertArray : throwTypeError,
          boolean: convertBoolean,
          buffer: convertBuffer,
          null: convertNull,
          number: convertNumber,
          object: initial ? convertObject : throwTypeError,
          string: convertString,
          symbol: throwTypeError,
          undefined: convertUndefined,
        }),
      );
    };

    doConvert(optionsIn, true);
  }
}
