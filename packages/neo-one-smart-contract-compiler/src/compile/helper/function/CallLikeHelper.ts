import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { isBuiltinCall } from '../../builtins';
import { Types } from '../../helper/types/Types';
import { ScriptBuilder } from '../../sb';
import { SYSCALLS } from '../../syscalls';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export class CallLikeHelper extends Helper<ts.CallExpression | ts.TaggedTemplateExpression> {
  public readonly kind = ts.SyntaxKind.CallExpression;

  public emit(
    sb: ScriptBuilder,
    expression: ts.CallExpression | ts.TaggedTemplateExpression,
    optionsIn: VisitOptions,
  ): void {
    const expr = ts.isCallExpression(expression)
      ? tsUtils.expression.getExpression(expression)
      : tsUtils.template.getTag(expression);

    const valueBuiltin = sb.builtins.getValue(sb.context, expr);
    if (valueBuiltin !== undefined && !tsUtils.guards.isSuperExpression(expr)) {
      // Otherwise, already reported as an error by typescript checker
      if (isBuiltinCall(valueBuiltin)) {
        valueBuiltin.emitCall(sb, expression, optionsIn);
      }

      return;
    }

    const symbol = sb.getSymbol(expr, { warning: false, error: false });
    if (ts.isIdentifier(expr) && sb.isGlobalSymbol(expr, symbol, 'syscall')) {
      if (!ts.isCallExpression(expression)) {
        sb.reportUnsupported(expression);

        return;
      }

      this.handleSysCall(sb, expression, optionsIn);

      return;
    }

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(expr, 'DROP');
      sb.emitHelper(expr, innerOptions, sb.helpers.throwTypeError);
    };

    const handleArguments = (innerOptions: VisitOptions) => {
      if (ts.isCallExpression(expression)) {
        // [argsarr]
        sb.emitHelper(expression, innerOptions, sb.helpers.args);
      } else {
        const template = tsUtils.template.getTemplate(expression);
        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          // [0]
          sb.emitPushInt(template, 0);
          // [literalsArr]
          sb.emitOp(template, 'NEWARRAY');
          // [literalsArr, literalsArr]
          sb.emitOp(template, 'DUP');
          // [stringVal]
          sb.visit(template, innerOptions);
          // [literalsArr]
          sb.emitOp(template, 'APPEND');
          // [literalsArrayVal]
          sb.emitHelper(template, innerOptions, sb.helpers.wrapArray);
          // [vals.length + 1, literalsArrayVal]
          sb.emitPushInt(template, 1);
          // [argsarr]
          sb.emitOp(template, 'PACK');
        } else {
          const head = tsUtils.template.getTemplateHead(template);
          _.reverse([...tsUtils.template.getTemplateSpans(template)]).forEach((span) => {
            // [val]
            sb.visit(tsUtils.expression.getExpression(span), innerOptions);
          });

          // [0]
          sb.emitPushInt(template, 0);
          // [literalsArr]
          sb.emitOp(template, 'NEWARRAY');
          // [literalsArr, literalsArr]
          sb.emitOp(template, 'DUP');
          // [string, literalsArr, literalsArr]
          sb.emitPushString(head, tsUtils.literal.getLiteralValue(head));
          // [stringVal, literalsArr, literalsArr]
          sb.emitHelper(head, innerOptions, sb.helpers.createString);
          // [literalsArr]
          sb.emitOp(head, 'APPEND');
          tsUtils.template.getTemplateSpans(template).forEach((span) => {
            const spanLiteral = tsUtils.template.getLiteral(span);
            // [string, literalsArr, literalsArr]
            sb.emitOp(spanLiteral, 'DUP');
            // [string, literalsArr, literalsArr]
            sb.emitPushString(spanLiteral, tsUtils.literal.getLiteralValue(spanLiteral));
            // [stringVal, literalsArr, literalsArr]
            sb.emitHelper(head, innerOptions, sb.helpers.createString);
            // [literalsArr]
            sb.emitOp(expr, 'APPEND');
          });
          // [literalsArrayVal]
          sb.emitHelper(template, innerOptions, sb.helpers.wrapArray);
          // [vals.length + 1, literalsArrayVal]
          sb.emitPushInt(template, tsUtils.template.getTemplateSpans(template).length + 1);
          // [argsarr]
          sb.emitOp(template, 'PACK');
        }
      }
    };

    const handlePropertyVisit = (lhs: ts.Node, innerOptions: VisitOptions) => {
      if (tsUtils.guards.isSuperExpression(lhs)) {
        // [thisValue]
        sb.scope.getThis(sb, lhs, innerOptions);
        // [superPrototype, thisValue]
        sb.visit(lhs, innerOptions);
      } else {
        // [expr]
        sb.visit(lhs, innerOptions);
        // [expr, expr]
        sb.emitOp(lhs, 'DUP');
      }
    };

    if (
      ts.isCallExpression(expression) &&
      tsUtils.guards.isSuperExpression(tsUtils.expression.getExpression(expression))
    ) {
      const superClass = optionsIn.superClass;
      if (superClass === undefined) {
        /* istanbul ignore next */
        throw new Error('Something went wrong, expected super class to be defined.');
      }
      const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
      // [argsarr]
      handleArguments(options);
      // [thisValue, argsarr]
      sb.scope.getThis(sb, expression, options);
      // [ctor, thisValue, argsarr]
      sb.scope.get(sb, expression, options, superClass);
      // []
      sb.emitHelper(expression, sb.noPushValueOptions(options), sb.helpers.invokeConstruct());
    } else if (ts.isPropertyAccessExpression(expr)) {
      const value = tsUtils.expression.getExpression(expr);
      const valueType = sb.getType(value);
      const name = tsUtils.node.getNameNode(expr);
      const nameValue = tsUtils.node.getName(expr);

      const builtinProp = sb.builtins.getMember(sb.context, value, name);
      if (builtinProp !== undefined) {
        if (!isBuiltinCall(builtinProp)) {
          sb.reportError(
            expr,
            DiagnosticCode.InvalidBuiltinReference,
            DiagnosticMessage.CannotReferenceBuiltinProperty,
          );

          return;
        }

        builtinProp.emitCall(sb, expression, optionsIn);

        return;
      }

      const createProcessBuiltin = (valueName: string) => {
        const member = sb.builtins.getOnlyMember(sb.context, valueName, nameValue);

        if (member === undefined) {
          return throwTypeError;
        }

        return () => {
          if (!isBuiltinCall(member)) {
            /* istanbul ignore next */
            sb.reportError(
              expr,
              DiagnosticCode.InvalidBuiltinReference,
              DiagnosticMessage.CannotReferenceBuiltinProperty,
            );

            /* istanbul ignore next */
            return;
          }

          // [thisVal]
          sb.emitOp(expression, 'DROP');
          member.emitCall(sb, expression, optionsIn, true);
        };
      };

      const processObject = (innerOptions: VisitOptions) => {
        // [argsarr, objectVal, thisVal]
        handleArguments(innerOptions);
        // [thisVal, argsarr, objectVal]
        sb.emitOp(expr, 'ROT');
        // [objectVal, thisVal, argsarr]
        sb.emitOp(expr, 'ROT');
        // [string, objectVal, objectVal, argsarr]
        sb.emitPushString(name, nameValue);
        // [val, objectVal, argsarr]
        sb.emitHelper(expr, innerOptions, sb.helpers.getPropertyObjectProperty);
        sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
      };

      const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
      // [val, thisVal]
      handlePropertyVisit(value, options);
      sb.emitHelper(
        value,
        options,
        sb.helpers.forBuiltinType({
          type: valueType,
          array: createProcessBuiltin('Array'),
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
    } else if (ts.isElementAccessExpression(expr)) {
      const value = tsUtils.expression.getExpression(expr);
      const valueType = sb.getType(value);
      const prop = tsUtils.expression.getArgumentExpressionOrThrow(expr);
      const propType = sb.getType(prop);

      const builtinProp = sb.builtins.getMember(sb.context, value, prop);
      if (builtinProp !== undefined) {
        if (!isBuiltinCall(builtinProp)) {
          sb.reportError(
            expr,
            DiagnosticCode.InvalidBuiltinReference,
            DiagnosticMessage.CannotReferenceBuiltinProperty,
          );

          return;
        }

        builtinProp.emitCall(sb, expression, optionsIn);

        return;
      }

      const getCallCases = (instanceName: string, useSymbol = false) =>
        sb.builtins
          .getMembers(
            sb.context,
            instanceName,
            isBuiltinCall,
            (call) => call.canCall(sb, expression, optionsIn),
            useSymbol,
          )
          .map(([propName, builtin]) => ({
            condition: () => {
              // [string, string, objectVal, thisVal]
              sb.emitOp(prop, 'DUP');
              // [string, string, string, objectVal, thisVal]
              sb.emitPushString(prop, propName);
              // [boolean, string, objectVal, thisVal]
              sb.emitOp(prop, 'EQUAL');
            },
            whenTrue: () => {
              // [objectVal, thisVal]
              sb.emitOp(expr, 'DROP');
              // [thisVal]
              sb.emitOp(expr, 'DROP');
              builtin.emitCall(sb, expression, optionsIn, true);
            },
          }));

      const throwInnerTypeError = (innerOptions: VisitOptions) => {
        // [objectVal, thisVal]
        sb.emitOp(expr, 'DROP');
        // [thisVal]
        sb.emitOp(expr, 'DROP');
        throwTypeError(innerOptions);
      };

      const createHandleProp = (
        handleString: (options: VisitOptions) => void,
        handleNumber: (options: VisitOptions) => void,
        handleSymbol: (options: VisitOptions) => void,
      ) => (innerOptions: VisitOptions) => {
        // [propVal, objectVal, thisVal]
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

      const createProcessBuiltin = (instanceName: string) => {
        const handleStringBase = (innerInnerOptions: VisitOptions) => {
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.case(getCallCases(instanceName, false), () => {
              throwInnerTypeError(innerInnerOptions);
            }),
          );
        };

        const handleString = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
          handleStringBase(innerInnerOptions);
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
          handleStringBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.case(getCallCases(instanceName, true), () => {
              throwInnerTypeError(innerInnerOptions);
            }),
          );
        };

        return createHandleProp(handleString, handleNumber, handleSymbol);
      };

      const createProcessArray = () => {
        const handleNumberBase = (innerInnerOptions: VisitOptions) => {
          // [number, arrayVal]
          sb.emitOp(expr, 'NIP');
          // [argsarr, number, arrayVal]
          handleArguments(innerInnerOptions);
          // [arrayVal, argsarr, number]
          sb.emitOp(expr, 'ROT');
          // [number, arrayVal, argsarr]
          sb.emitOp(expr, 'ROT');
          // [arrayVal, number, arrayVal, argsarr]
          sb.emitOp(expr, 'OVER');
          // [number, arrayVal, arrayVal, argsarr]
          sb.emitOp(expr, 'SWAP');
          // [val, arrayVal, argsarr]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getArrayIndex);
          sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
        };

        const handleString = (innerInnerOptions: VisitOptions) => {
          // [string, arrayVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.case(getCallCases('Array', false), () => {
              // [stringVal, arrayVal, thisVal]
              sb.emitHelper(prop, innerInnerOptions, sb.helpers.createString);
              // [number, arrayVal, thisVal]
              sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
              handleNumberBase(innerInnerOptions);
            }),
          );
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [number, arrayVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getNumber);
          handleNumberBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, arrayVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.case(getCallCases('Array', true), () => {
              throwInnerTypeError(innerInnerOptions);
            }),
          );
        };

        return createHandleProp(handleString, handleNumber, handleSymbol);
      };

      const processObject = (innerOptions: VisitOptions) => {
        const handleStringBase = (innerInnerOptions: VisitOptions) => {
          // [val, objectVal, argsarr]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getPropertyObjectProperty);
          sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
          handleStringBase(innerInnerOptions);
        };

        const handleString = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getString);
          handleStringBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.getSymbol);
          // [val, objectVal, argsarr]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getSymbolObjectProperty);
          sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
        };

        // [argsarr, objectVal, thisVal]
        handleArguments(innerOptions);
        // [thisVal, argsarr, objectVal]
        sb.emitOp(expression, 'ROT');
        // [objectVal, thisVal, argsarr]
        sb.emitOp(expression, 'ROT');
        // [propVal, objectVal, thisVal, argsarr]
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

      const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
      // [val, thisVal]
      handlePropertyVisit(value, options);
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
    } else {
      const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
      // [argsarr]
      handleArguments(options);
      // [objectVal, argsarr]
      sb.visit(expr, options);
      sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: false }));
    }
  }

  private handleSysCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    const sysCallName = tsUtils.expression.getArguments(node)[0];

    const reportError = () => {
      sb.reportError(sysCallName, DiagnosticCode.InvalidSyscall, DiagnosticMessage.InvalidSyscall);
    };
    if (!ts.isStringLiteral(sysCallName)) {
      reportError();

      return;
    }

    const sysCallKey = tsUtils.literal.getLiteralValue(sysCallName) as keyof typeof SYSCALLS;
    const sysCall = SYSCALLS[sysCallKey] as typeof SYSCALLS[keyof typeof SYSCALLS] | undefined;
    if (sysCall === undefined) {
      reportError();
    } else {
      sysCall.handleCall(sb, node, options);
    }
  }
}
