import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { Builtin, isBuiltinInstanceMemberValue, isBuiltinMemberValue } from '../builtins';
import { Types } from '../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ElementAccessExpressionCompiler extends NodeCompiler<ts.ElementAccessExpression> {
  public readonly kind = ts.SyntaxKind.ElementAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.ElementAccessExpression, optionsIn: VisitOptions): void {
    const isOptionalChain = ts.isOptionalChain(expr);
    const value = tsUtils.expression.getExpression(expr);
    const valueType = sb.context.analysis.getType(value);
    const prop = tsUtils.expression.getArgumentExpressionOrThrow(expr);
    const propType = sb.context.analysis.getType(prop);

    const handleBuiltin = (member: Builtin, visited: boolean) => {
      if (isBuiltinInstanceMemberValue(member)) {
        member.emitValue(sb, expr, optionsIn, visited);

        return;
      }

      if (isBuiltinMemberValue(member)) {
        member.emitValue(sb, expr, optionsIn);

        return;
      }

      if (optionsIn.setValue) {
        sb.context.reportError(prop, DiagnosticCode.InvalidBuiltinModify, DiagnosticMessage.CannotModifyBuiltin);
      } else {
        sb.context.reportError(
          prop,
          DiagnosticCode.InvalidBuiltinReference,
          DiagnosticMessage.CannotReferenceBuiltinProperty,
        );
      }
    };

    const builtinProp = sb.context.builtins.getMember(value, prop);
    if (builtinProp !== undefined) {
      handleBuiltin(builtinProp, false);

      return;
    }

    const getValueCases = (name: string, useSymbol = false) =>
      sb.context.builtins
        .getMembers(name, isBuiltinInstanceMemberValue, () => true, useSymbol)
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
            handleBuiltin(builtin, true);
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

    const processUndefined = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(expr, 'DROP');
      // [undefinedVal]
      sb.emitHelper(expr, innerOptions, sb.helpers.wrapUndefined);
    };

    const throwTypeErrorUnlessOptionalChain = (innerOptions: VisitOptions) => {
      isOptionalChain ? processUndefined(innerOptions) : throwTypeError(innerOptions);
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
          arrayStorage: throwInnerTypeError,
          boolean: throwInnerTypeError,
          buffer: throwInnerTypeError,
          null: throwInnerTypeError,
          number: handleNumber,
          object: throwInnerTypeError,
          string: handleString,
          symbol: handleSymbol,
          undefined: throwInnerTypeError,
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
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
        handleStringBase(innerInnerOptions);
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
        handleStringBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
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
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('Array', false), () => {
            // [stringVal, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.wrapString);
            // [number, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
            handleNumberBase(innerInnerOptions);
          }),
        );
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapNumber);
        handleNumberBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
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

    const createProcessArrayStorage = () => {
      const handleNumberBase = (innerInnerOptions: VisitOptions) => {
        if (optionsIn.pushValue && optionsIn.setValue) {
          // [number, number, objectVal, val]
          sb.emitPushInt(expr, 2);
          // [val, number, objectVal, val]
          sb.emitOp(expr, 'PICK');
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setArrayStorage);
        } else if (optionsIn.pushValue) {
          // [numberVal, val]
          sb.emitHelper(expr, options, sb.helpers.wrapNumber);
          // [val]
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.getStructuredStorage({
              type: Types.ArrayStorage,
              keyType: undefined,
              knownKeyType: Types.Number,
            }),
          );
        } else if (optionsIn.setValue) {
          // [val, number, objectVal]
          sb.emitOp(expr, 'ROT');
          // []
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.setArrayStorage);
        } else {
          // [objectVal]
          sb.emitOp(expr, 'DROP');
          // []
          sb.emitOp(expr, 'DROP');
        }
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('ArrayStorage', false), () => {
            // [stringVal, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.wrapString);
            // [number, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
            handleNumberBase(innerInnerOptions);
          }),
        );
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapNumber);
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.coerceToInt);
        handleNumberBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('ArrayStorage', true), () => {
            throwInnerTypeError(innerInnerOptions);
          }),
        );
      };

      return createHandleProp(handleString, handleNumber, handleSymbol);
    };

    const createProcessBuffer = () => {
      const handleNumberBase = (innerInnerOptions: VisitOptions) => {
        if (optionsIn.pushValue) {
          // [val]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getBufferIndex);
        } else {
          // [objectVal]
          sb.emitOp(expr, 'DROP');
          // []
          sb.emitOp(expr, 'DROP');
        }
      };

      const handleString = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('Buffer', false), () => {
            // [stringVal, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.wrapString);
            // [number, objectVal]
            sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
            handleNumberBase(innerInnerOptions);
          }),
        );
      };

      const handleNumber = (innerInnerOptions: VisitOptions) => {
        // [number, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapNumber);
        handleNumberBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
        sb.emitHelper(
          expr,
          innerInnerOptions,
          sb.helpers.case(getValueCases('Buffer', true), () => {
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
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
        handleStringBase(innerInnerOptions);
      };

      const handleSymbol = (innerInnerOptions: VisitOptions) => {
        // [string, objectVal]
        sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);

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
          arrayStorage: throwInnerTypeError,
          boolean: throwInnerTypeError,
          buffer: throwInnerTypeError,
          null: throwInnerTypeError,
          number: handleNumber,
          object: throwInnerTypeError,
          string: handleString,
          symbol: handleSymbol,
          undefined: throwInnerTypeError,
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
        arrayStorage: createProcessArrayStorage(),
        boolean: createProcessBuiltin('Boolean'),
        buffer: createProcessBuffer(),
        null: throwTypeErrorUnlessOptionalChain,
        number: createProcessBuiltin('Number'),
        object: processObject,
        string: createProcessBuiltin('String'),
        symbol: createProcessBuiltin('Symbol'),
        undefined: throwTypeErrorUnlessOptionalChain,
        map: createProcessBuiltin('Map'),
        mapStorage: createProcessBuiltin('MapStorage'),
        set: createProcessBuiltin('Set'),
        setStorage: createProcessBuiltin('SetStorage'),
        error: createProcessBuiltin('Error'),
        forwardValue: createProcessBuiltin('ForwardValue'),
        iteratorResult: createProcessBuiltin('IteratorResult'),
        iterable: createProcessBuiltin('Iterable'),
        iterableIterator: createProcessBuiltin('IterableIterator'),
        transaction: createProcessBuiltin('Transaction'),
        attribute: createProcessBuiltin('AttributeBase'),
        contract: createProcessBuiltin('Contract'),
        block: createProcessBuiltin('Block'),
      }),
    );
  }
}
