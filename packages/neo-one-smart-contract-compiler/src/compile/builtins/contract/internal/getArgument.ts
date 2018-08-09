import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class GetArgument extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = args[0];

    const options = sb.pushValueOptions(optionsIn);
    // [numberVal]
    sb.visit(arg, options);
    if (optionsIn.pushValue) {
      // [value]
      sb.emitHelper(node, options, sb.helpers.getArgument({ type: sb.context.getType(arg) }));
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapValRecursive({ type: sb.context.getType(node, { error: true }) }));
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
