import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class BufferConcat extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
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
