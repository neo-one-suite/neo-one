import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../../common';
import { Helper } from '../../Helper';

import { Types } from '../Types';

// Input: [val]
// Output: [number]
export class ToNumberHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    if (this.type !== undefined) {
      this.convertType(sb, node, options, this.type);
    } else {
      this.convertUnknown(sb, node, options);
    }
  }

  private convertType(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, type: ts.Type): void {
    if (tsUtils.type_.isOnlyUndefined(type)) {
      this.convertUndefined(sb, node, options);
    } else if (tsUtils.type_.isOnlyNull(type)) {
      this.convertNull(sb, node);
    } else if (tsUtils.type_.isOnlyBooleanish(type)) {
      this.convertBoolean(sb, node, options);
    } else if (tsUtils.type_.isOnlyNumberish(type)) {
      this.convertNumber(sb, node, options);
    } else if (tsUtils.type_.isOnlyStringish(type)) {
      this.convertString(sb, node, options);
    } else if (tsUtils.type_.isOnlySymbolish(type)) {
      this.convertSymbol(sb, node, options);
    } else if (tsUtils.type_.isOnlyObject(type)) {
      this.convertObject(sb, node, options);
    } else {
      this.convertUnknown(sb, node, options);
    }
  }

  private convertUndefined(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.throwTypeError);
  }

  private convertNull(sb: ScriptBuilder, node: ts.Node): void {
    // []
    sb.emitOp(node, 'DROP');
    // [0]
    sb.emitPushInt(node, 0);
  }

  private convertBoolean(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          sb.emitHelper(node, options, sb.helpers.getBoolean);
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
  }

  private convertNumber(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [value]
    sb.emitHelper(node, options, sb.helpers.getNumber);
  }

  private convertString(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    const n = sb.scope.addUnique();
    const remain = sb.scope.addUnique();
    const accum = sb.scope.addUnique();

    // [string]
    sb.emitHelper(node, options, sb.helpers.getString);
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
              each: () => {
                // [remain]
                sb.scope.get(sb, node, options, remain);
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
                sb.scope.set(sb, node, options, remain);
                // [1, remain]
                sb.emitPushInt(node, 1);
                // [char]
                sb.emitOp(node, 'RIGHT');
                // [0x30, char]
                sb.emitPushInt(node, 0x30);
                // [char - 0x30]
                sb.emitOp(node, 'SUB');
                // [n, number]
                sb.scope.get(sb, node, options, n);
                // [n, n, number]
                sb.emitOp(node, 'DUP');
                // [number, n, n, number]
                sb.emitPushInt(node, 10);
                // [number, n number]
                sb.emitOp(node, 'MUL');
                // [n, number]
                sb.scope.set(sb, node, options, n);
                // [number]
                sb.emitOp(node, 'MUL');
                // [accum, number]
                sb.scope.get(sb, node, options, accum);
                // [number]
                sb.emitOp(node, 'ADD');
                // []
                sb.scope.set(sb, node, options, accum);
              },
            }),
          );
          // [number]
          sb.scope.get(sb, node, options, accum);
        },
      }),
    );
  }

  private convertSymbol(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.throwTypeError);
  }

  private convertObject(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [primitive]
    sb.emitHelper(
      node,
      options,
      sb.helpers.toPrimitive({
        type: this.type,
        knownType: Types.Object,
        preferredType: 'number',
      }),
    );
    // [value]
    this.convertUnknown(sb, node, options, true);
  }

  private convertUnknown(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, shouldThrowOnObject = false): void {
    const emitIf = (check: Helper, whenTrue: () => void, whenFalse: () => void) =>
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [value, value]
            sb.emitOp(node, 'DUP');
            // [isValue, value]
            sb.emitHelper(node, options, check);
          },
          whenTrue,
          whenFalse,
        }),
      );

    emitIf(
      sb.helpers.isNumber,
      () => this.convertNumber(sb, node, options),
      () =>
        emitIf(
          sb.helpers.isUndefined,
          () => this.convertUndefined(sb, node, options),
          () =>
            emitIf(
              sb.helpers.isNull,
              () => this.convertNull(sb, node),
              () =>
                emitIf(
                  sb.helpers.isBoolean,
                  () => this.convertBoolean(sb, node, options),
                  () =>
                    emitIf(
                      sb.helpers.isString,
                      () => this.convertString(sb, node, options),
                      () =>
                        emitIf(
                          sb.helpers.isSymbol,
                          () => this.convertSymbol(sb, node, options),
                          () => {
                            if (shouldThrowOnObject) {
                              sb.emitHelper(node, options, sb.helpers.throwTypeError);
                            } else {
                              this.convertObject(sb, node, options);
                            }
                          },
                        ),
                    ),
                ),
            ),
        ),
    );
  }
}
