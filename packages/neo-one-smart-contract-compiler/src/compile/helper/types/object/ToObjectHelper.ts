import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../../common';

// Input: [val]
// Output: [objectVal]
export class ToObjectHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const type = this.type;
    if (type !== undefined) {
      if (tsUtils.type_.isOnlyBooleanish(type)) {
        this.convertPrimitive(sb, node, options, 'Boolean');

        return;
      }

      if (tsUtils.type_.isOnlyNumberish(type)) {
        this.convertPrimitive(sb, node, options, 'Number');

        return;
      }

      if (tsUtils.type_.isOnlyStringish(type)) {
        this.convertPrimitive(sb, node, options, 'String');

        return;
      }

      if (tsUtils.type_.isOnlySymbolish(type)) {
        this.convertPrimitive(sb, node, options, 'Symbol');

        return;
      }

      if (tsUtils.type_.isOnlyObject(type)) {
        return;
      }
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.case(
        [
          {
            condition: () => {
              // [val, val]
              sb.emitOp(node, 'DUP');
              // [isObject, val]
              sb.emitHelper(node, options, sb.helpers.isObject);
            },
            whenTrue: () => {
              // do nothing
            },
          },
        ].concat(
          [
            { helper: sb.helpers.isBoolean, primitive: 'Boolean' },
            { helper: sb.helpers.isNumber, primitive: 'Number' },
            { helper: sb.helpers.isString, primitive: 'String' },
            { helper: sb.helpers.isSymbol, primitive: 'Symbol' },
          ].map(({ helper, primitive }) => ({
            condition: () => {
              // [val, val]
              sb.emitOp(node, 'DUP');
              // [isObject, val]
              sb.emitHelper(node, options, helper);
            },
            whenTrue: () => {
              this.convertPrimitive(sb, node, options, primitive);
            },
          })),
        ),
        () => {
          sb.emitHelper(node, options, sb.helpers.throwTypeError);
        },
      ),
    );
  }

  public convertPrimitive(sb: ScriptBuilder, node: ts.Node, options: VisitOptions, primitive: string): void {
    // [1, val]
    sb.emitPushInt(node, 1);
    // [valArgsArray]
    sb.emitOp(node, 'PACK');
    // [globalObjectVal, valArgsArray]
    sb.scope.getGlobal(sb, node, options);
    // [primitiveString, globalObjectVal, valArgsArray]
    sb.emitPushString(node, primitive);
    // [primitiveObjectVal, valArgsArray]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [val]
    sb.emitHelper(node, options, sb.helpers.invokeCall());
  }
}
