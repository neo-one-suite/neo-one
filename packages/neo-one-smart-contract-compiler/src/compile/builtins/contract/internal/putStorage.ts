import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class PutStorage extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length < 2) {
      /* istanbul ignore next */
      return;
    }

    const key = args[0];
    const val = args[1];

    const options = sb.pushValueOptions(optionsIn);
    // [valVal]
    sb.visit(val, options);
    // [valBuffer]
    sb.emitSysCall(val, 'Neo.Runtime.Serialize');
    // [keyVal, valBuffer]
    sb.visit(key, options);
    // [keyBuffer, valBuffer]
    sb.emitSysCall(val, 'Neo.Runtime.Serialize');
    // []
    sb.emitHelper(node, options, sb.helpers.putStorage);
  }
}
