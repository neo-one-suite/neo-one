import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferEquals extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public canCall(sb: ScriptBuilder, node: CallLikeExpression): boolean {
    if (!ts.isCallExpression(node)) {
      return false;
    }

    const arg = tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined;
    if (arg === undefined) {
      return false;
    }

    const type = sb.getType(arg, { error: true });

    return type !== undefined && sb.isGlobal(arg, type, 'Buffer');
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      return;
    }

    const func = tsUtils.expression.getExpression(node);
    if (!ts.isPropertyAccessExpression(func)) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);

      /* istanbul ignore next */
      return;
    }

    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 1) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);

      /* istanbul ignore next */
      return;
    }

    const options = sb.pushValueOptions(optionsIn);

    const lhs = tsUtils.expression.getExpression(func);
    // [bufferVal]
    sb.visit(lhs, options);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [bufferVal, buffer]
    sb.visit(args[0], options);
    // [buffer, buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [boolean]
    sb.emitOp(node, 'EQUAL');
    // [booleanVal]
    sb.emitHelper(node, options, sb.helpers.createBoolean);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
