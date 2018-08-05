import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { isBuiltinMemberValue } from '../builtins';
import { Types } from '../helper/types/Types';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ElementAccessExpressionCompiler extends NodeCompiler<ts.ElementAccessExpression> {
  public readonly kind = ts.SyntaxKind.ElementAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.ElementAccessExpression, optionsIn: VisitOptions): void {
    const value = tsUtils.expression.getExpression(expr);
    const valueType = sb.getType(value);
    const prop = tsUtils.expression.getArgumentExpressionOrThrow(expr);
    const propType = sb.getType(prop);

    const builtinProp = sb.builtins.getMember(sb.context, value, prop);
    if (builtinProp !== undefined) {
      if (!isBuiltinMemberValue(builtinProp)) {
        sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltinProperty);

        return;
      }

      builtinProp.emitValue(sb, expr, optionsIn);

      return;
    }

    const getValueCases = (name: string, useSymbol = false) =>
      sb.builtins
        .getMembers(sb.context, name, isBuiltinMemberValue, () => true, useSymbol)
        .map(([propName, builtin]) => ({
          condition: () => {
            // [string, string, objectVal]
            sb.emitOp(prop, 'DUP');
            // [string, string, string, objectVal]
            sb.emitPushString(prop, propName);
            // [boolean, string, objectVal]
            sb.emitOp(prop, 'EQUAL');
          },
          whenTrue: () => {
            // [objectVal]
            sb.emitOp(expr, 'DROP');
            builtin.emitValue(sb, expr, optionsIn, true);
          },
        }));

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(expr, 'DROP');
      sb.emitHelper(expr, innerOptions, sb.helpers.throwTypeError);
    };

    const throwInnerTypeError = (innerOptions: VisitOptions) => {
      // [objectVal]
      sb.emitOp(expr, 'DROP');
      throwTypeError(innerOptions);
    };

    const createHandleProp = (
      handleString: (options: VisitOptions) => void,
      handleNumber: (options: VisitOptions) => void,
      handleSymbol: (options: VisitOptions) => void,
    ) => (innerOptions: VisitOptions) => {
      // [propVal, objectVal]
      sb.visit(prop, innerOptions);
      sb.emitHelper(
        prop,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: propType,
          array: throwInnerTypeError,
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

    const createProcessBuiltin = (name: string) => {
      const handleStringBase = (innerInnerOptions: VisitOptions) => {
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases(name, false), () => {
            throwInnerTypeError(innerInnerOptions);
          }),
        );
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
        handleStringBase(innerInnerOptions);
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
        handleStringBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases(name, true), () => {
            throwInnerTypeError(innerInnerOptions);
          }),
        );
      };

      return createHandleProp(handleString, handleNumber, handleSymbol);
    };

    const createProcessArray = () => {
      const handleNumberBase = (innerInnerOptions: VisitOptions) => {
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
        } else {
          // [objectVal]
          sb.emitOp(expr, 'DROP');
          // []
          sb.emitOp(expr, 'DROP');
        }
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('Array', false), () => {
            // [stringVal, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.createString);
            // [number, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
            handleNumberBase(innerInnerOptions);
          }),
        );
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getNumber);
        handleNumberBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('Array', true), () => {
            throwInnerTypeError(innerInnerOptions);
          }),
        );
      };

      return createHandleProp(handleString, handleNumber, handleSymbol);
    };

    const processObject = (innerOptions: VisitOptions) => {
      const handleStringBase = (innerInnerOptions: VisitOptions) => {
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
        handleStringBase(innerInnerOptions);
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
        handleStringBase(innerInnerOptions);
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

      // [propVal, objectVal]
      sb.visit(prop, innerOptions);
      if (!optionsIn.pushValue && !optionsIn.setValue) {
        sb.emitOp(expr, 'DROP');
        sb.emitOp(expr, 'DROP');

        return;
      }

      sb.emitHelper(
        prop,
        innerOptions,
        sb.helpers.forBuiltinType({
          type: propType,
          array: throwInnerTypeError,
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

    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    // [val]
    sb.visit(value, options);
    sb.emitHelper(
      value,
      options,
      sb.helpers.forBuiltinType({
        type: valueType,
        array: createProcessArray(),
        boolean: createProcessBuiltin('Boolean'),
        buffer: createProcessBuiltin('Buffer'),
        null: throwTypeError,
        number: createProcessBuiltin('Number'),
        object: processObject,
        string: createProcessBuiltin('String'),
        symbol: createProcessBuiltin('Symbol'),
        undefined: throwTypeError,
      }),
    );
  }
}
