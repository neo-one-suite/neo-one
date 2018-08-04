import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { isBuiltInMemberValue } from '../../../builtins';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { Helper } from '../../Helper';
import { Types } from '../Types';

// Input: [val]
// Output: [val]
export class ElementAccessHelper extends Helper<ts.ElementAccessExpression> {
  public emit(sb: ScriptBuilder, expr: ts.ElementAccessExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));

    const value = tsUtils.expression.getExpression(expr);
    const valueType = sb.getType(value);
    const prop = tsUtils.expression.getArgumentExpressionOrThrow(expr);
    const propType = sb.getType(prop);

    const throwTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(expr, 'DROP');
      sb.emitHelper(expr, innerOptions, sb.helpers.throwTypeError);
    };

    const throwInnerTypeError = (innerOptions: VisitOptions) => {
      sb.emitOp(expr, 'DROP');
      throwTypeError(innerOptions);
    };

    const createProcessBuiltIn = (builtInSymbol: ts.Symbol) => () => {
      if (!ts.isStringLiteral(prop)) {
        sb.reportError(expr, 'Cannot index builtin', DiagnosticCode.CANNOT_INDEX_BUILTIN);

        return;
      }

      const name = tsUtils.literal.getLiteralValue(prop);
      const member = tsUtils.symbol.getMember(builtInSymbol, name);
      if (member === undefined) {
        /* istanbul ignore next */
        sb.reportUnsupported(expr);

        /* istanbul ignore next */
        return;
      }

      const builtin = sb.builtIns.get(member);
      if (builtin === undefined) {
        /* istanbul ignore next */
        sb.reportUnsupported(expr);

        /* istanbul ignore next */
        return;
      }

      if (!isBuiltInMemberValue(builtin)) {
        sb.reportError(expr, 'Built-ins may not be referenced.', DiagnosticCode.CANNOT_REFERENCE_BUILTIN_PROPERTY);

        return;
      }

      builtin.emitValue(sb, expr, optionsIn, true);
    };

    const processArray = (innerOptions: VisitOptions) => {
      // [propVal, objectVal]
      sb.visit(prop, innerOptions);
      if (!optionsIn.pushValue && !optionsIn.setValue) {
        sb.emitOp(expr, 'DROP');
        sb.emitOp(expr, 'DROP');

        return;
      }

      const handleBase = (innerInnerOptions: VisitOptions) => {
        if (optionsIn.pushValue && optionsIn.setValue) {
          // [number, number, objectVal, val]
          sb.emitPushInt(expr, 2);
          // [val, number, objectVal, val]
          sb.emitOp(expr, 'PICK');
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setArrayIndex);
        } else if (optionsIn.pushValue) {
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getArrayIndex);
        } else if (optionsIn.setValue) {
          // [val, number, objectVal]
          sb.emitOp(expr, 'ROT');
          // []
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setArrayIndex);
        }
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getNumber);
        handleBase(innerInnerOptions);
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
        handleBase(innerInnerOptions);
      };

      sb.emitHelper(
        prop,
        innerOptions,
        sb.helpers.forBuiltInType({
          type: propType,
          array: processArray,
          boolean: throwInnerTypeError,
          buffer: throwInnerTypeError,
          null: throwInnerTypeError,
          number: handleNumber,
          object: throwInnerTypeError,
          string: handleString,
          symbol: throwInnerTypeError,
          undefined: throwInnerTypeError,
        }),
      );
    };

    const processObject = (innerOptions: VisitOptions) => {
      // [propVal, objectVal]
      sb.visit(prop, innerOptions);
      if (!optionsIn.pushValue && !optionsIn.setValue) {
        sb.emitOp(expr, 'DROP');
        sb.emitOp(expr, 'DROP');

        return;
      }

      const handleBaseProperty = (innerInnerOptions: VisitOptions) => {
        if (optionsIn.pushValue && optionsIn.setValue) {
          // [objectVal, string, objectVal, val]
          sb.emitOp(expr, 'OVER');
          // [string, objectVal, string, objectVal, val]
          sb.emitOp(expr, 'OVER');
          // [number, string, objectVal, string, objectVal, val]
          sb.emitPushInt(expr, 4);
          // [val, string, objectVal, string, objectVal]
          sb.emitOp(expr, 'ROLL');
          // [string, objectVal]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setPropertyObjectProperty);
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getPropertyObjectProperty);
        } else if (optionsIn.pushValue) {
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getPropertyObjectProperty);
        } else if (optionsIn.setValue) {
          // [val, string, objectVal]
          sb.emitOp(expr, 'ROT');
          // []
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setPropertyObjectProperty);
        }
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
        handleBaseProperty(innerInnerOptions);
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
        handleBaseProperty(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);

        if (optionsIn.pushValue && optionsIn.setValue) {
          // [objectVal, string, objectVal, val]
          sb.emitOp(expr, 'OVER');
          // [string, objectVal, string, objectVal, val]
          sb.emitOp(expr, 'OVER');
          // [number, string, objectVal, string, objectVal, val]
          sb.emitPushInt(expr, 4);
          // [val, string, objectVal, string, objectVal]
          sb.emitOp(expr, 'ROLL');
          // [string, objectVal]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setSymbolObjectProperty);
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getSymbolObjectProperty);
        } else if (optionsIn.pushValue) {
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getSymbolObjectProperty);
        } else if (optionsIn.setValue) {
          // [val, string, objectVal]
          sb.emitOp(expr, 'ROT');
          // []
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setSymbolObjectProperty);
        }
      };

      sb.emitHelper(
        prop,
        innerOptions,
        sb.helpers.forBuiltInType({
          type: propType,
          array: processArray,
          boolean: throwInnerTypeError,
          buffer: throwInnerTypeError,
          null: throwInnerTypeError,
          number: handleNumber,
          object: throwInnerTypeError,
          string: handleString,
          symbol: handleSymbol,
          undefined: throwInnerTypeError,
        }),
      );
    };

    sb.emitHelper(
      value,
      options,
      sb.helpers.forBuiltInType({
        type: valueType,
        array: processArray,
        boolean: createProcessBuiltIn(sb.builtInSymbols.boolean),
        buffer: createProcessBuiltIn(sb.builtInSymbols.buffer),
        null: throwTypeError,
        number: createProcessBuiltIn(sb.builtInSymbols.number),
        object: processObject,
        string: createProcessBuiltIn(sb.builtInSymbols.string),
        symbol: createProcessBuiltIn(sb.builtInSymbols.symbol),
        undefined: throwTypeError,
      }),
    );
  }
}
