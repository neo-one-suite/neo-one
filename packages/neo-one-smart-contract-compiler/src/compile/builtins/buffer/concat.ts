import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferConcat extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public canCall(): boolean {
    throw new Error('Something went wrong.');
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      /* istanbul ignore next */
      throw new Error('Something went wrong.');
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
