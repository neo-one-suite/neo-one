import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../../common';

// Input: [val]
// Output: [boolean]
export class ToBooleanHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    if (this.type !== undefined) {
      this.convertType(sb, node, options, this.type);
    } else {
      this.convertUnknownType(sb, node, options);
    }
  }

  private convertType(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, type: ts.Type): void {
    if (tsUtils.type_.isOnlyUndefined(type) || tsUtils.type_.isOnlyNull(type)) {
      sb.emitPushBoolean(node, false);
    } else if (tsUtils.type_.isOnlyBooleanish(type)) {
      this.convertBoolean(sb, node, options);
    } else if (tsUtils.type_.isOnlyNumberish(type)) {
      this.convertNumber(sb, node, options);
    } else if (tsUtils.type_.isOnlyStringish(type)) {
      this.convertString(sb, node, options);
    } else if (
      // It's a symbol or an object
      !tsUtils.type_.hasUndefined(type) &&
      !tsUtils.type_.hasNull(type) &&
      !tsUtils.type_.hasBooleanish(type) &&
      !tsUtils.type_.hasNumberish(type) &&
      !tsUtils.type_.hasStringish(type)
    ) {
      sb.emitPushBoolean(node, true);
    } else {
      this.convertUnknownType(sb, node, options);
    }
  }

  private convertBoolean(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.getBoolean);
  }

  private convertNumber(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.getNumber);
    sb.emitPushInt(node, 0);
    sb.emitOp(node, 'NUMNOTEQUAL');
  }

  private convertString(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.getString);
    sb.emitPushString(node, '');
    sb.emitOp(node, 'EQUAL');
    sb.emitOp(node, 'NOT');
  }

  private convertUnknownType(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.case(
        [
          {
            condition: () => {
              // [value, value]
              sb.emitOp(node, 'DUP');
              // [isBoolean, value]
              sb.emitHelper(node, options, sb.helpers.isBoolean);
            },
            whenTrue: () => {
              // [value]
              sb.emitHelper(node, options, sb.helpers.getBoolean);
            },
          },
          {
            condition: () => {
              // [value, value]
              sb.emitOp(node, 'DUP');
              // [isNull, value]
              sb.emitHelper(node, options, sb.helpers.isNull);
              // [value, isNull, value]
              sb.emitOp(node, 'OVER');
              // [isUndefined, isNull, value]
              sb.emitHelper(node, options, sb.helpers.isUndefined);
              // [isUndefinedOrNull, value]
              sb.emitOp(node, 'OR');
            },
            whenTrue: () => {
              sb.emitOp(node, 'DROP');
              sb.emitPushBoolean(node, false);
            },
          },
          {
            condition: () => {
              // [value, value]
              sb.emitOp(node, 'DUP');
              // [isObject, value]
              sb.emitHelper(node, options, sb.helpers.isObject);
              // [value, isObject, value]
              sb.emitOp(node, 'OVER');
              // [isSymbol, isObject, value]
              sb.emitHelper(node, options, sb.helpers.isSymbol);
              // [isSymbolOrObject, value]
              sb.emitOp(node, 'OR');
            },
            whenTrue: () => {
              sb.emitPushBoolean(node, true);
            },
          },
          {
            condition: () => {
              // [value, value]
              sb.emitOp(node, 'DUP');
              // [isNumber, value]
              sb.emitHelper(node, options, sb.helpers.isNumber);
            },
            whenTrue: () => {
              this.convertNumber(sb, node, options);
            },
          },
        ],
        () => {
          this.convertString(sb, node, options);
        },
      ),
    );
  }
}
