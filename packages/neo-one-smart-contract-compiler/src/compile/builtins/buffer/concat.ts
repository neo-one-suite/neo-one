import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferConcat extends BuiltInBase implements BuiltInCall {
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

    return (
      type !== undefined &&
      tsUtils.type_.isOnlyArrayish(type) &&
      sb.isGlobal(arg, tsUtils.type_.getArrayTypeOrThrow(type), 'Buffer')
    );
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    const arg = tsUtils.argumented.getArguments(node)[0];
    // [arrayVal]
    sb.visit(arg, options);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.concatBuffer);
    // [bufferVal]
    sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
