import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
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
      sb.context.reportError(node, DiagnosticCode.InvalidLiteral, DiagnosticMessage.EventNotifierArguments);

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

          // [...params]
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.parameters({
              params: paramDecls,
              onStack: true,
              map: (param, innerInnerOptions) => {
                // [value]
                sb.emitHelper(node, innerInnerOptions, sb.helpers.unwrapValRecursive({ type: paramTypes.get(param) }));
              },
            }),
          );
          // [eventName, ...params]
          sb.emitPushString(node, eventName);
          // [number, eventName, ...params]
          sb.emitPushInt(node, paramDecls.length + 1);
          // [arr]
          sb.emitOp(node, 'PACK');
          // []
          sb.emitSysCall(node, 'Neo.Runtime.Notify');
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
