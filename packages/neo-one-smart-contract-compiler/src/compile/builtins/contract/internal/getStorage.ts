import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { hasUndefined } from '../../../helper/types';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class GetStorage extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length < 1) {
      /* istanbul ignore next */
      return;
    }

    const type = sb.context.getType(node, { error: true });
    const key = args[0];
    const options = sb.pushValueOptions(optionsIn);

    const handleValue = () => {
      // [val]
      sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
    };

    const handleNull = () => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [value, value]
            sb.emitOp(node, 'DUP');
            // [length, value]
            sb.emitOp(node, 'SIZE');
            // [0, length, value]
            sb.emitPushInt(node, 0);
            // [length === 0, value]
            sb.emitOp(node, 'NUMEQUAL');
          },
          whenTrue: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [val]
            sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          },
          whenFalse: () => {
            handleValue();
          },
        }),
      );
    };

    const shouldHandleNull = () => type !== undefined && hasUndefined(sb.context, node, type);

    // [keyVal]
    sb.visit(key, options);
    if (optionsIn.pushValue) {
      // [keyBuffer]
      sb.emitSysCall(key, 'Neo.Runtime.Serialize');
      // [context, keyBuffer]
      sb.emitSysCall(node, 'Neo.Storage.GetReadOnlyContext');
      // [value]
      sb.emitSysCall(node, 'Neo.Storage.Get');
      if (shouldHandleNull()) {
        handleNull();
      } else {
        handleValue();
      }
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
