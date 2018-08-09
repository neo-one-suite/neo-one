import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { InternalObjectProperty } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinMemberCall } from '../../BuiltinMemberCall';
import { MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class AddressGetSmartContract extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    const arg = tsUtils.argumented.getArguments(node)[0];
    const scriptHash = sb.context.analysis.extractLiteralAddress(arg);
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
        return undefined;
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

            // Save the current state of the stack
            // [depth, argsarr, ...stack]
            sb.emitOp(prop, 'DEPTH');
            // [argsarr, ...stack, argsarr]
            sb.emitOp(prop, 'XTUCK');
            // [...stack, argsarr]
            sb.emitOp(prop, 'DROP');
            // [depth, ...stack, argsarr]
            sb.emitOp(prop, 'DEPTH');
            // [depth - 1, ...stack, argsarr]
            sb.emitOp(prop, 'DEC');
            // [stack, argsarr]
            sb.emitOp(prop, 'PACK');
            // [scopes, stack, argsarr]
            sb.emitOp(prop, 'FROMALTSTACK');
            // [stack, scopes, argsarr]
            sb.emitOp(prop, 'SWAP');
            // [scopes, argsarr]
            sb.emitOp(prop, 'TOALTSTACK');
            // [argsarr]
            sb.emitOp(prop, 'TOALTSTACK');

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
            sb.emitOp(prop, 'DEPTH');
            // [params]
            sb.emitOp(prop, 'PACK');
            // [string, params]
            sb.emitPushString(prop, propName);

            if (scriptHash === undefined) {
              // [bufferVal, string, params]
              sb.visit(arg, innerOptions);
              // [buffer, string, params]
              sb.emitHelper(prop, innerOptions, sb.helpers.unwrapBuffer);
              // [result]
              sb.emitOp(prop, 'APPCALL', Buffer.alloc(20, 0));
            } else {
              // [result]
              sb.emitOp(prop, 'APPCALL', scriptHash);
            }

            const restoreStack = () => {
              // [scopes, retVal]
              sb.emitOp(prop, 'FROMALTSTACK');
              // [stack, scopes, retVal]
              sb.emitOp(prop, 'FROMALTSTACK');
              // [scopes, stack, retVal]
              sb.emitOp(prop, 'SWAP');
              // [stack, retVal]
              sb.emitOp(prop, 'TOALTSTACK');
              // [length, ...stack, retVal]
              sb.emitOp(prop, 'UNPACK');
              // [retVal, ...stack]
              sb.emitOp(prop, 'ROLL');
            };

            if (propReturnType !== undefined && tsUtils.type_.isVoid(propReturnType)) {
              sb.emitHelper(prop, innerOptions, sb.helpers.wrapUndefined);
              restoreStack();
            } else {
              restoreStack();
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

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
