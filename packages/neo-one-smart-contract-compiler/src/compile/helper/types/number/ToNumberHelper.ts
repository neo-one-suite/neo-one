import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../TypedHelper';

// Input: [val]
// Output: [number]
export class ToNumberHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const throwTypeError = (options: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, options, sb.helpers.throwTypeError);
    };

    const convertNull = () => {
      // []
      sb.emitOp(node, 'DROP');
      // [0]
      sb.emitPushInt(node, 0);
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
            // [1]
            sb.emitPushInt(node, 1);
          },
          whenFalse: () => {
            // [0]
            sb.emitPushInt(node, 0);
          },
        }),
      );
    };

    const convertArray = (options: VisitOptions) => {
      // [primitive]
      sb.emitHelper(
        node,
        options,
        sb.helpers.toPrimitive({ type: this.type, knownType: Types.Array, preferredType: 'number' }),
      );
      // [string]
      doConvert(options, false);
    };

    const convertNumber = (options: VisitOptions) => {
      // [value]
      sb.emitHelper(node, options, sb.helpers.unwrapNumber);
    };

    const convertString = (options: VisitOptions) => {
      const n = sb.scope.addUnique();
      const remain = sb.scope.addUnique();
      const accum = sb.scope.addUnique();

      // [string]
      sb.emitHelper(node, options, sb.helpers.unwrapString);
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [string, string]
            sb.emitOp(node, 'DUP');
            // ['', string, string]
            sb.emitPushString(node, '');
            // [string === '', string]
            sb.emitOp(node, 'EQUAL');
          },
          whenTrue: () => {
            // We don't support NaN
            // []
            sb.emitHelper(node, options, sb.helpers.throwTypeError);
          },
          whenFalse: () => {
            // []
            sb.scope.set(sb, node, options, remain);
            // [1]
            sb.emitPushInt(node, 1);
            // []
            sb.scope.set(sb, node, options, n);
            // [number]
            sb.emitPushInt(node, 0);
            // []
            sb.scope.set(sb, node, options, accum);
            sb.emitHelper(
              node,
              options,
              sb.helpers.forLoop({
                condition: () => {
                  // [remain]
                  sb.scope.get(sb, node, options, remain);
                  // ['', remain]
                  sb.emitPushString(node, '');
                  // [remain === '']
                  sb.emitOp(node, 'EQUAL');
                  // [boolean]
                  sb.emitOp(node, 'NOT');
                },
                each: (innerOptions) => {
                  // [remain]
                  sb.scope.get(sb, node, innerOptions, remain);
                  // [remain, remain]
                  sb.emitOp(node, 'DUP');
                  // [remain, remain, remain]
                  sb.emitOp(node, 'DUP');
                  // [number, remain, remain]
                  sb.emitOp(node, 'SIZE');
                  // [number, remain, remain]
                  sb.emitOp(node, 'DEC');
                  // [nextRemain, remain]
                  sb.emitOp(node, 'LEFT');
                  // [remain]
                  sb.scope.set(sb, node, innerOptions, remain);
                  // [1, remain]
                  sb.emitPushInt(node, 1);
                  // [char]
                  sb.emitOp(node, 'RIGHT');
                  // [0x30, char]
                  sb.emitPushInt(node, 0x30);
                  // [char - 0x30]
                  sb.emitOp(node, 'SUB');
                  // [number]
                  sb.emitHelper(
                    node,
                    innerOptions,
                    sb.helpers.if({
                      condition: () => {
                        // [number, number]
                        sb.emitOp(node, 'DUP');
                        // [9, number, number]
                        sb.emitPushInt(node, 9);
                        // [number > 9, number]
                        sb.emitOp(node, 'GT');
                      },
                      whenTrue: () => {
                        // []
                        sb.emitOp(node, 'DROP');
                        // []
                        sb.emitHelper(node, options, sb.helpers.throwTypeError);
                      },
                      whenFalse: () => {
                        sb.emitHelper(
                          node,
                          innerOptions,
                          sb.helpers.if({
                            condition: () => {
                              // [number, number]
                              sb.emitOp(node, 'DUP');
                              // [0, number, number]
                              sb.emitPushInt(node, 0);
                              // [number > 0, number]
                              sb.emitOp(node, 'LT');
                            },
                            whenTrue: () => {
                              // []
                              sb.emitOp(node, 'DROP');
                              // []
                              sb.emitHelper(node, options, sb.helpers.throwTypeError);
                            },
                          }),
                        );
                      },
                    }),
                  );
                  // [n, number]
                  sb.scope.get(sb, node, innerOptions, n);
                  // [n, n, number]
                  sb.emitOp(node, 'DUP');
                  // [number, n, n, number]
                  sb.emitPushInt(node, 10);
                  // [number, n number]
                  sb.emitOp(node, 'MUL');
                  // [n, number]
                  sb.scope.set(sb, node, innerOptions, n);
                  // [number]
                  sb.emitOp(node, 'MUL');
                  // [accum, number]
                  sb.scope.get(sb, node, innerOptions, accum);
                  // [number]
                  sb.emitOp(node, 'ADD');
                  // []
                  sb.scope.set(sb, node, innerOptions, accum);
                },
              }),
            );
            // [number]
            sb.scope.get(sb, node, options, accum);
          },
        }),
      );
    };

    const convertObject = (options: VisitOptions): void => {
      // [primitive]
      sb.emitHelper(
        node,
        options,
        sb.helpers.toPrimitive({ type: this.type, knownType: Types.Object, preferredType: 'number' }),
      );
      // [string]
      doConvert(options, false);
    };

    const doConvert = (options: VisitOptions, initial = true) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.forBuiltinType({
          type: initial ? this.type : undefined,
          knownType: initial ? this.knownType : undefined,
          array: initial ? convertArray : throwTypeError,
          arrayStorage: throwTypeError,
          boolean: convertBoolean,
          buffer: throwTypeError,
          null: convertNull,
          number: convertNumber,
          object: initial ? convertObject : throwTypeError,
          string: convertString,
          symbol: throwTypeError,
          undefined: throwTypeError,
          map: throwTypeError,
          mapStorage: throwTypeError,
          set: throwTypeError,
          setStorage: throwTypeError,
          error: throwTypeError,
          iteratorResult: throwTypeError,
          iterable: throwTypeError,
          iterableIterator: throwTypeError,
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
    };

    doConvert(sb.pushValueOptions(optionsIn), true);

    if (!optionsIn.pushValue) {
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }
  }
}
