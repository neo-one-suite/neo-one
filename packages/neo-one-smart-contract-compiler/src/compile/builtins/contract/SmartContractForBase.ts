import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { BUILTIN_PROPERTIES, IGNORED_PROPERTIES } from '../../../constants';
import { getSetterName } from '../../../utils';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { Name } from '../../scope';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

export abstract class SmartContractForBase extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    const returnType = sb.context.analysis.getType(node);
    if (returnType === undefined) {
      /* istanbul ignore next */
      return;
    }

    const properties = tsUtils.type_.getProperties(returnType);
    const props = properties.map((prop) => {
      const propType = sb.context.analysis.getTypeOfSymbol(prop, node);
      if (propType === undefined) {
        /* istanbul ignore next */
        return undefined;
      }

      const propName = tsUtils.symbol.getName(prop);
      if (IGNORED_PROPERTIES.has(propName)) {
        return undefined;
      }
      if (BUILTIN_PROPERTIES.has(propName)) {
        return undefined;
      }
      const propNode = tsUtils.symbol.getValueDeclarationOrThrow(prop);
      if (
        tsUtils.modifier.isStatic(propNode) ||
        tsUtils.modifier.isProtected(propNode) ||
        tsUtils.modifier.isPrivate(propNode)
      ) {
        return undefined;
      }

      const result = sb.context.analysis.extractSignatureForType(propNode, propType, { error: true });
      if (result === undefined) {
        // Must be a property, not a method
        return {
          paramDecls: [],
          paramTypes: new Map<ts.ParameterDeclaration, ts.Type | undefined>(),
          returnType: propType,
          prop: propNode,
          propName,
          accessor: true,
          isReadonly: tsUtils.modifier.isReadonly(propNode),
        };
      }

      return { ...result, prop: propNode, propName, accessor: false, isReadonly: false };
    });

    const handleParams = (
      prop: ts.Declaration,
      paramDecls: ReadonlyArray<ts.ParameterDeclaration>,
      paramTypes: Map<ts.ParameterDeclaration, ts.Type | undefined>,
      innerOptions: VisitOptions,
    ) => {
      // [params]
      sb.emitHelper(
        prop,
        innerOptions,
        sb.helpers.parameters({
          params: paramDecls,
          asArgsArr: true,
          map: (param, innerInnerOptions, isRestElement) => {
            let type = paramTypes.get(param);
            if (type !== undefined && isRestElement) {
              type = tsUtils.type_.getArrayType(type);
            }
            // [value]
            sb.emitHelper(param, innerInnerOptions, sb.helpers.unwrapValRecursive({ type }));
          },
        }),
      );
    };

    const addressName = sb.scope.addUnique();
    this.emitInitial(sb, func, node, addressName, options);

    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal]
    props
      .filter(utils.notNull)
      .forEach(({ prop, propName, paramDecls, paramTypes, returnType: propReturnType, accessor, isReadonly }) => {
        // [objectVal, objectVal]
        sb.emitOp(prop, 'DUP');
        // [string, objectVal, objectVal]
        sb.emitPushString(prop, propName);
        if (accessor && !isReadonly) {
          sb.emitHelper(
            prop,
            options,
            sb.helpers.createFunctionArray({
              body: (innerOptionsIn) => {
                const innerOptions = sb.pushValueOptions(innerOptionsIn);
                // [0, argsarr]
                sb.emitPushInt(prop, 0);
                // [val]
                sb.emitOp(prop, 'PICKITEM');
                // [value]
                sb.emitHelper(prop, innerOptions, sb.helpers.unwrapValRecursive({ type: propReturnType }));
                // [1, value]
                sb.emitPushInt(prop, 1);
                // [params]
                sb.emitOp(prop, 'PACK');
                // [string, params]
                sb.emitPushString(prop, getSetterName(propName));

                this.emitInvoke(
                  sb,
                  func,
                  node,
                  prop,
                  addressName,
                  getSetterName(propName),
                  1,
                  false,
                  sb.noPushValueOptions(innerOptions),
                );
                // [val]
                sb.emitHelper(prop, innerOptions, sb.helpers.wrapUndefined);
                // []
                sb.emitHelper(prop, innerOptions, sb.helpers.return);
              },
            }),
          );
          sb.emitHelper(
            prop,
            options,
            sb.helpers.createFunctionObject({
              property: InternalObjectProperty.Call,
            }),
          );
        }
        // [farr, string, objectVal, objectVal]
        sb.emitHelper(
          prop,
          options,
          sb.helpers.createFunctionArray({
            body: (innerOptionsIn) => {
              const innerOptions = sb.pushValueOptions(innerOptionsIn);
              if (accessor) {
                // []
                sb.emitOp(prop, 'DROP');
                // [params]
                sb.emitOp(prop, 'NEWARRAY0');
              } else {
                // [params]
                handleParams(prop, paramDecls, paramTypes, innerOptions);
              }
              // [string, params]
              sb.emitPushString(prop, propName);

              const isVoidReturn = propReturnType !== undefined && tsUtils.type_.isVoid(propReturnType);
              this.emitInvoke(
                sb,
                func,
                node,
                prop,
                addressName,
                propName,
                accessor ? 0 : paramDecls.length,
                !isVoidReturn,
                innerOptions,
              );

              if (isVoidReturn) {
                sb.emitHelper(prop, innerOptions, sb.helpers.wrapUndefined);
              } else {
                // [val]
                sb.emitHelper(
                  prop,
                  innerOptions,
                  sb.helpers.wrapValRecursive({
                    type: propReturnType,
                  }),
                );
              }

              // []
              sb.emitHelper(prop, innerOptions, sb.helpers.return);
            },
          }),
        );
        // [fobj, string, objectVal, objectVal]
        sb.emitHelper(
          prop,
          options,
          sb.helpers.createFunctionObject({
            property: InternalObjectProperty.Call,
          }),
        );
        if (accessor) {
          // [objectVal]
          sb.emitHelper(
            prop,
            options,
            sb.helpers.setAccessorPropertyObjectProperty({ hasGet: true, hasSet: !isReadonly }),
          );
        } else {
          // [objectVal]
          sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
        }
      });

    // [objectVal]
    this.emitAdditionalProperties(sb, func, node, options);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }

  protected emitInitial(
    _sb: ScriptBuilder,
    _func: MemberLikeExpression,
    _node: ts.CallExpression,
    _addressName: Name,
    _options: VisitOptions,
  ): void {
    // do nothing
  }

  protected emitAdditionalProperties(
    _sb: ScriptBuilder,
    _func: MemberLikeExpression,
    _node: ts.CallExpression,
    _options: VisitOptions,
  ): void {
    // do nothing
  }

  protected abstract emitInvoke(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    prop: ts.Declaration,
    addressName: Name,
    method: string,
    paramCount: number,
    hasReturnValue: boolean,
    optionsIn: VisitOptions,
  ): void;
}
