import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import {
  Builtin,
  BuiltinInstanceMemberTemplate,
  CallMemberLikeExpression,
  isBuiltinCall,
  isBuiltinInstanceMemberCall,
  isBuiltinInstanceMemberTemplate,
  isBuiltinMemberCall,
  isBuiltinMemberTemplate,
  isBuiltinTemplate,
} from '../../builtins';
import { BuiltinInstanceMemberCall } from '../../builtins/BuiltinInstanceMemberCall';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export class CallLikeHelper extends Helper<ts.CallExpression | ts.TaggedTemplateExpression> {
  public readonly kind = ts.SyntaxKind.CallExpression;

  public emit(
    sb: ScriptBuilder,
    expression: ts.CallExpression | ts.TaggedTemplateExpression,
    optionsIn: VisitOptions,
  ): void {
    const isOptionalChain = ts.isOptionalChain(expression);
    const expr = ts.isCallExpression(expression)
      ? tsUtils.expression.getExpression(expression)
      : tsUtils.template.getTag(expression);

    const valueBuiltin = sb.context.builtins.getValue(expr);
    if (valueBuiltin !== undefined && !tsUtils.guards.isSuperExpression(expr)) {
      // Otherwise, already reported as an error by typescript checker
      if (ts.isCallExpression(expression) && isBuiltinCall(valueBuiltin)) {
        valueBuiltin.emitCall(sb, expression, optionsIn);

        return;
      }

      if (ts.isTaggedTemplateExpression(expression) && isBuiltinTemplate(valueBuiltin)) {
        valueBuiltin.emitCall(sb, expression, optionsIn);

        return;
      }

      sb.context.reportError(expr, DiagnosticCode.InvalidBuiltinCall, DiagnosticMessage.InvalidBuiltinCall);
    }

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(expr, 'DROP');
      sb.emitHelper(expr, innerOptions, sb.helpers.throwTypeError);
    };

    const processUndefined = (innerOptions: VisitOptions) => {
      // [argsarr]
      sb.emitOp(expr, 'DROP');
      // []
      sb.emitOp(expr, 'DROP');
      // [undefinedVal]
      sb.emitHelper(expr, innerOptions, sb.helpers.wrapUndefined);
    };

    const throwTypeErrorUnlessOptionalChain = (innerOptions: VisitOptions) => {
      isOptionalChain ? processUndefined(innerOptions) : throwTypeError(innerOptions);
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
          sb.emitHelper(head, innerOptions, sb.helpers.wrapString);
          // [literalsArr]
          sb.emitOp(head, 'APPEND');
          tsUtils.template.getTemplateSpans(template).forEach((span) => {
            const spanLiteral = tsUtils.template.getLiteral(span);
            // [string, literalsArr, literalsArr]
            sb.emitOp(spanLiteral, 'DUP');
            // [string, literalsArr, literalsArr]
            sb.emitPushString(spanLiteral, tsUtils.literal.getLiteralValue(spanLiteral));
            // [stringVal, literalsArr, literalsArr]
            sb.emitHelper(head, innerOptions, sb.helpers.wrapString);
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

    const isValidBuiltinCall = (builtinProp: Builtin) => {
      if (ts.isCallExpression(expression)) {
        return isBuiltinMemberCall(builtinProp) || isBuiltinInstanceMemberCall(builtinProp);
      }

      if (ts.isTaggedTemplateExpression(expression)) {
        return isBuiltinMemberTemplate(builtinProp) || isBuiltinInstanceMemberTemplate(builtinProp);
      }

      return false;
    };

    const handleBuiltinMemberCall = (builtinProp: Builtin, memberLike: CallMemberLikeExpression, visited: boolean) => {
      if (ts.isCallExpression(expression)) {
        if (isBuiltinMemberCall(builtinProp)) {
          builtinProp.emitCall(sb, memberLike, expression, optionsIn);

          return;
        }

        if (isBuiltinInstanceMemberCall(builtinProp)) {
          builtinProp.emitCall(sb, memberLike, expression, optionsIn, visited);

          return;
        }
      } else if (ts.isTaggedTemplateExpression(expression)) {
        if (isBuiltinMemberTemplate(builtinProp)) {
          builtinProp.emitCall(sb, memberLike, expression, optionsIn);

          return;
        }

        if (isBuiltinInstanceMemberTemplate(builtinProp)) {
          builtinProp.emitCall(sb, memberLike, expression, optionsIn, visited);

          return;
        }
      }
    };

    const emitDropNTimes = (innerSb: ScriptBuilder, node: ts.Node, n: number) => {
      // tslint:disable-next-line: no-loop-statement
      for (let i = 0; i < n; i += 1) {
        innerSb.emitOp(node, 'DROP');
      }
    };

    // Input: [...vals]
    // Output: isNullOrUndefined ? [undefinedVal] : callCallback()
    const callIfNotNullOrUndefined = ({
      innerOptions,
      argsNum,
      callback,
    }: {
      innerOptions: VisitOptions;
      argsNum: number;
      callback: () => void;
    }) => {
      sb.emitHelper(
        expr,
        optionsIn,
        sb.helpers.if({
          condition: () => {
            // [val, ...vals]
            sb.emitOp(expr, 'DUP');
            // [isNull, ...vals]
            sb.emitHelper(expr, optionsIn, sb.helpers.isNull);
          },
          whenTrue: () => {
            // []
            emitDropNTimes(sb, expr, argsNum);
            // [undefinedVal]
            sb.emitHelper(expr, innerOptions, sb.helpers.wrapUndefined);
          },
          whenFalse: () => {
            sb.emitHelper(
              expr,
              optionsIn,
              sb.helpers.if({
                condition: () => {
                  // [val, ...vals]
                  sb.emitOp(expr, 'DUP');
                  // [isUndefined, ...vals]
                  sb.emitHelper(expr, optionsIn, sb.helpers.isUndefined);
                },
                whenTrue: () => {
                  // []
                  emitDropNTimes(sb, expr, argsNum);
                  // [undefinedVal]
                  sb.emitHelper(expr, innerOptions, sb.helpers.wrapUndefined);
                },
                whenFalse: () => {
                  callback();
                },
              }),
            );
          },
        }),
      );
    };

    const superExpression = ts.isCallExpression(expression) ? tsUtils.expression.getExpression(expression) : undefined;
    if (
      ts.isCallExpression(expression) &&
      superExpression !== undefined &&
      tsUtils.guards.isSuperExpression(superExpression)
    ) {
      if (optionsIn.handleSuperConstruct !== undefined) {
        optionsIn.handleSuperConstruct(expression, superExpression, optionsIn);

        return;
      }
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
      const valueType = sb.context.analysis.getType(value);
      const name = tsUtils.node.getNameNode(expr);
      const nameValue = tsUtils.node.getName(expr);

      const builtinProp = sb.context.builtins.getMember(value, name);
      if (builtinProp !== undefined && isValidBuiltinCall(builtinProp)) {
        handleBuiltinMemberCall(builtinProp, expr, false);

        return;
      }

      const createProcessBuiltin = (valueName: string) => {
        const member = sb.context.builtins.getOnlyMember(valueName, nameValue);

        if (member === undefined) {
          return throwTypeError;
        }

        return () => {
          // [thisVal]
          sb.emitOp(expression, 'DROP');
          handleBuiltinMemberCall(member, expr, true);
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
        isOptionalChain
          ? callIfNotNullOrUndefined({
              innerOptions,
              argsNum: 3,
              callback: () => sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true })),
            })
          : sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
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
          arrayStorage: createProcessBuiltin('ArrayStorage'),
          boolean: createProcessBuiltin('Boolean'),
          buffer: createProcessBuiltin('Buffer'),
          null: throwTypeError,
          number: createProcessBuiltin('Number'),
          object: processObject,
          string: createProcessBuiltin('String'),
          symbol: createProcessBuiltin('Symbol'),
          undefined: throwTypeError,
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
          contractManifest: createProcessBuiltin('ContractManifest'),
          contractABI: createProcessBuiltin('ContractABI'),
          contractMethod: createProcessBuiltin('ContractMethodDescriptor'),
          contractEvent: createProcessBuiltin('ContractEventDescriptor'),
          contractParameter: createProcessBuiltin('ContractParameterDefinition'),
          contractGroup: createProcessBuiltin('ContractGroup'),
          contractPermission: createProcessBuiltin('ContractPermission'),
        }),
      );
    } else if (ts.isElementAccessExpression(expr)) {
      const value = tsUtils.expression.getExpression(expr);
      const valueType = sb.context.analysis.getType(value);
      const prop = tsUtils.expression.getArgumentExpressionOrThrow(expr);
      const propType = sb.context.analysis.getType(prop);

      const builtinProp = sb.context.builtins.getMember(value, prop);
      if (builtinProp !== undefined && isValidBuiltinCall(builtinProp)) {
        handleBuiltinMemberCall(builtinProp, expr, false);

        return;
      }

      const getCallCases = (instanceName: string, useSymbol = false) =>
        sb.context.builtins
          .getMembers(
            instanceName,
            (call): call is BuiltinInstanceMemberCall | BuiltinInstanceMemberTemplate =>
              isBuiltinInstanceMemberCall(call) || isBuiltinInstanceMemberTemplate(call),
            (call) =>
              (ts.isCallExpression(expression) &&
                isBuiltinInstanceMemberCall(call) &&
                call.canCall(sb, expr, expression, optionsIn)) ||
              (ts.isTaggedTemplateExpression(expression) &&
                isBuiltinInstanceMemberTemplate(call) &&
                call.canCall(sb, expr, expression, optionsIn)),
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

              handleBuiltinMemberCall(builtin, expr, true);
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
            contractManifest: throwInnerTypeError,
            contractABI: throwInnerTypeError,
            contractMethod: throwInnerTypeError,
            contractEvent: throwInnerTypeError,
            contractParameter: throwInnerTypeError,
            contractGroup: throwInnerTypeError,
            contractPermission: throwInnerTypeError,
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
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
          handleStringBase(innerInnerOptions);
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
          handleStringBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
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
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
          sb.emitHelper(
            expr,
            innerInnerOptions,
            sb.helpers.case(getCallCases('Array', false), () => {
              // [stringVal, arrayVal, thisVal]
              sb.emitHelper(prop, innerInnerOptions, sb.helpers.wrapString);
              // [number, arrayVal, thisVal]
              sb.emitHelper(prop, innerInnerOptions, sb.helpers.toNumber({ type: propType, knownType: Types.String }));
              handleNumberBase(innerInnerOptions);
            }),
          );
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [number, arrayVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapNumber);
          handleNumberBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, arrayVal, thisVal]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
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
          isOptionalChain
            ? // valIsNullOrUndefined ? [undefinedVal] : invokeCall()
              callIfNotNullOrUndefined({
                innerOptions,
                argsNum: 3,
                callback: () => sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true })),
              })
            : sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
        };

        const handleNumber = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.toString({ type: propType, knownType: Types.Number }));
          handleStringBase(innerInnerOptions);
        };

        const handleString = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapString);
          handleStringBase(innerInnerOptions);
        };

        const handleSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, objectVal, objectVal, argsarr]
          sb.emitHelper(prop, innerInnerOptions, sb.helpers.unwrapSymbol);
          // [val, objectVal, argsarr]
          sb.emitHelper(expr, innerInnerOptions, sb.helpers.getSymbolObjectProperty);
          isOptionalChain
            ? // valIsNullOrUndefined ? [undefinedVal] : invokeCall()
              callIfNotNullOrUndefined({
                innerOptions,
                argsNum: 3,
                callback: () => sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true })),
              })
            : sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: true }));
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
            contractManifest: throwInnerTypeError,
            contractABI: throwInnerTypeError,
            contractMethod: throwInnerTypeError,
            contractEvent: throwInnerTypeError,
            contractParameter: throwInnerTypeError,
            contractGroup: throwInnerTypeError,
            contractPermission: throwInnerTypeError,
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
          arrayStorage: createProcessBuiltin('ArrayStorage'),
          boolean: createProcessBuiltin('Boolean'),
          buffer: createProcessBuiltin('Buffer'),
          null: throwTypeError,
          number: createProcessBuiltin('Number'),
          object: processObject,
          string: createProcessBuiltin('String'),
          symbol: createProcessBuiltin('Symbol'),
          undefined: throwTypeError,
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
          contractManifest: createProcessBuiltin('ContractManifest'),
          contractABI: createProcessBuiltin('ContractABI'),
          contractMethod: createProcessBuiltin('ContractMethodDescriptor'),
          contractEvent: createProcessBuiltin('ContractEventDescriptor'),
          contractParameter: createProcessBuiltin('ContractParameterDefinition'),
          contractGroup: createProcessBuiltin('ContractGroup'),
          contractPermission: createProcessBuiltin('ContractPermission'),
        }),
      );
    } else if (ts.isCallExpression(expression)) {
      const value = tsUtils.expression.getExpression(expression);
      const valueType = sb.context.analysis.getType(value);

      const processCall = () => {
        sb.emitHelper(expr, optionsIn, sb.helpers.invokeCall({ bindThis: false }));
      };

      const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
      // [argsarr]
      handleArguments(options);
      // [objectVal, argsarr]
      sb.visit(expr, options);
      sb.emitHelper(
        value,
        options,
        sb.helpers.forBuiltinType({
          type: valueType,
          array: throwTypeError,
          arrayStorage: throwTypeError,
          boolean: throwTypeError,
          buffer: throwTypeError,
          null: throwTypeErrorUnlessOptionalChain,
          number: throwTypeError,
          object: processCall,
          string: throwTypeError,
          symbol: throwTypeError,
          undefined: throwTypeErrorUnlessOptionalChain,
          map: throwTypeError,
          mapStorage: throwTypeError,
          set: throwTypeError,
          setStorage: throwTypeError,
          error: throwTypeError,
          forwardValue: throwTypeError,
          iteratorResult: throwTypeError,
          iterable: throwTypeError,
          iterableIterator: throwTypeError,
          transaction: throwTypeError,
          attribute: throwTypeError,
          contract: throwTypeError,
          block: throwTypeError,
          contractManifest: throwTypeError,
          contractABI: throwTypeError,
          contractMethod: throwTypeError,
          contractEvent: throwTypeError,
          contractParameter: throwTypeError,
          contractGroup: throwTypeError,
          contractPermission: throwTypeError,
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
}
