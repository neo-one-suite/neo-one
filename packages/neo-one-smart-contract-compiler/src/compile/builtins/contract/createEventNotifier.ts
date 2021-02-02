import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinCall } from '../BuiltinCall';
import { Builtins } from '../Builtins';

class CreateEventNotifier extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }

    const args = tsUtils.argumented.getArguments(node);
    if (args.length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = args[0];
    if (!ts.isStringLiteral(arg)) {
      return;
    }

    const eventName = tsUtils.literal.getLiteralValue(arg);
    const type = sb.context.analysis.getType(node);
    const result = sb.context.analysis.extractSignatureForType(node, type, { error: true });
    if (result === undefined) {
      /* istanbul ignore next */
      return;
    }

    const { paramDecls, paramTypes } = result;
    // [farr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);

          // [params]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.parameters({
              params: paramDecls,
              asArgsArr: true,
              map: (param, innerInnerOptions, isRestElement) => {
                let tpe = paramTypes.get(param);
                if (type !== undefined && isRestElement) {
                  tpe = tsUtils.type_.getArrayType(type);
                }
                // [value]
                sb.emitHelper(node, innerInnerOptions, sb.helpers.unwrapValRecursive({ type: tpe }));
              },
            }),
          );
          // [length, ...params]
          sb.emitOp(node, 'UNPACK');
          // [eventName, length, ...params]
          sb.emitPushString(node, eventName);
          // [length, eventName, ...params]
          sb.emitOp(node, 'SWAP');
          // [length, eventName, ...params]
          sb.emitOp(node, 'INC');
          // [arr]
          sb.emitOp(node, 'PACK');
          // [eventName, arr]
          sb.emitPushString(node, eventName);
          // []
          sb.emitSysCall(node, 'System.Runtime.Notify');
          // [val]
          sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.return);
        },
      }),
    );
    // [fobjectVal]
    sb.emitHelper(node, options, sb.helpers.createFunctionObject({ property: InternalObjectProperty.Call }));
  }
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('createEventNotifier', new CreateEventNotifier());
};
