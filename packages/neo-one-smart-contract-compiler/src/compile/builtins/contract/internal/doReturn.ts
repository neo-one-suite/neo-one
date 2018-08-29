import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class DoReturn extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArguments(node);
    if (args.length === 0) {
      // do nothing
    } else {
      const arg = args[0];

      // [val]
      sb.visit(arg, options);
      // [value]
      sb.emitHelper(node, options, sb.helpers.unwrapValRecursive({ type: sb.context.analysis.getType(arg) }));
      // Hack to make sure we only have one return value on the stack.
      // [number, value]
      sb.emitOp(node, 'DEPTH');
      // [arr]
      sb.emitOp(node, 'PACK');
      // [number, arr]
      sb.emitPushInt(node, 0);
      // [value]
      sb.emitOp(node, 'PICKITEM');
    }
  }
}
