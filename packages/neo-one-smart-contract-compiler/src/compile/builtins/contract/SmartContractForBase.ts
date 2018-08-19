import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
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
    const returnType = sb.context.getType(node, { error: true });
    if (returnType === undefined) {
      return;
    }

    const properties = tsUtils.type_.getProperties(returnType);
    const props = properties.map((prop) => {
      const propType = sb.context.getTypeOfSymbol(prop, node, { error: true });
      if (propType === undefined) {
        return undefined;
      }

      const propName = tsUtils.symbol.getName(prop);
      const propNode = tsUtils.symbol.getValueDeclarationOrThrow(prop);
      const result = sb.context.analysis.extractSignatureForType(propNode, propType, { error: true });
      if (result === undefined) {
        // Must be a property, not a method
        return {
          paramDecls: [],
          paramTypes: new Map<ts.ParameterDeclaration, ts.Type | undefined>(),
          returnType: propType,
          prop: propNode,
          propName,
        };
      }

      return { ...result, prop: propNode, propName };
    });

    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    // [objectVal]
    props.filter(utils.notNull).forEach(({ prop, propName, paramDecls, paramTypes, returnType: propReturnType }) => {
      // [objectVal, objectVal]
      sb.emitOp(prop, 'DUP');
      // [string, objectVal, objectVal]
      sb.emitPushString(prop, propName);
      // [farr, string, objectVal, objectVal]
      sb.emitHelper(
        prop,
        options,
        sb.helpers.createFunctionArray({
          body: (innerOptionsIn) => {
            const innerOptions = sb.pushValueOptions(innerOptionsIn);
            // [...params]
            sb.emitHelper(
              prop,
              innerOptions,
              sb.helpers.parameters({
                params: paramDecls,
                onStack: true,
                map: (param, innerInnerOptions) => {
                  // [value]
                  sb.emitHelper(
                    param,
                    innerInnerOptions,
                    sb.helpers.unwrapValRecursive({ type: paramTypes.get(param) }),
                  );
                },
              }),
            );
            // [length, ...params]
            sb.emitPushInt(prop, paramDecls.length);
            // [params]
            sb.emitOp(prop, 'PACK');
            // [string, params]
            sb.emitPushString(prop, propName);

            const isVoidReturn = propReturnType !== undefined && tsUtils.type_.isVoid(propReturnType);
            const callBuffer = Buffer.from([isVoidReturn ? 0 : 1, 2]);
            this.emitInvoke(sb, func, node, prop, callBuffer, innerOptions);

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
      // [objectVal]
      sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
    });

    // [objectVal]
    this.emitAdditionalProperties(sb, func, node, options);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
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
    callBuffer: Buffer,
    optionsIn: VisitOptions,
  ): void;
}
