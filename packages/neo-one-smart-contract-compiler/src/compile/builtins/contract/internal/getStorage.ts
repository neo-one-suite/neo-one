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
        sb.helpers.handleUndefinedStorage({
          handleUndefined: () => {
            sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          },
          handleDefined: () => {
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
      // [value]
      sb.emitHelper(node, optionsIn, sb.helpers.getCommonStorage);
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
