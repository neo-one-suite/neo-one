import { Node, Type } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { TypedHelper } from '../../common';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

import * as typeUtils from '../../../../typeUtils';
import { Types } from '../Types';

// Input: [val]
// Output: [number]
export class ToNumberHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');
      return;
    }

    if (this.type != null) {
      this.convertType(sb, node, options, this.type);
    } else {
      this.convertUnknown(sb, node, options);
    }
  }

  private convertType(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    type: Type,
  ): void {
    if (typeUtils.isOnlyUndefined(type)) {
      this.convertUndefined(sb, node, options);
    } else if (typeUtils.isOnlyNull(type)) {
      this.convertNull(sb, node, options);
    } else if (typeUtils.isOnlyBoolean(type)) {
      this.convertBoolean(sb, node, options);
    } else if (typeUtils.isOnlyNumber(type)) {
      this.convertNumber(sb, node, options);
    } else if (typeUtils.isOnlyString(type)) {
      this.convertString(sb, node, options);
    } else if (typeUtils.isOnlySymbol(type)) {
      this.convertSymbol(sb, node, options);
    } else if (typeUtils.isOnlyObject(type)) {
      this.convertObject(sb, node, options);
    } else {
      this.convertUnknown(sb, node, options);
    }
  }

  private convertUndefined(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    sb.emitHelper(node, options, sb.helpers.throwTypeError);
  }

  private convertNull(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // []
    sb.emitOp(node, 'DROP');
    // [0]
    sb.emitPushInt(node, 0);
  }

  private convertBoolean(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
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

  private convertNumber(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [value]
    sb.emitHelper(node, options, sb.helpers.getNumber);
  }

  private convertString(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    sb.emitHelper(node, options, sb.helpers.throwTypeError);
  }

  private convertSymbol(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    sb.emitHelper(node, options, sb.helpers.throwTypeError);
  }

  private convertObject(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
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

  private convertUnknown(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    shouldThrowOnObject: boolean = false,
  ): void {
    const emitIf = (
      check: Helper<Node>,
      whenTrue: () => void,
      whenFalse: () => void,
    ) =>
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
              () => this.convertNull(sb, node, options),
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
                          () =>
                            shouldThrowOnObject
                              ? sb.emitHelper(
                                  node,
                                  options,
                                  sb.helpers.throwTypeError,
                                )
                              : this.convertObject(sb, node, options),
                        ),
                    ),
                ),
            ),
        ),
    );
  }
}
