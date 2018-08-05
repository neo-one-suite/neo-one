import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayMap extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public canCall(_sb: ScriptBuilder, node: CallLikeExpression): boolean {
    return ts.isCallExpression(node) && tsUtils.argumented.getArguments(node).length === 1;
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions, visited = false): void {
    if (!ts.isCallExpression(node)) {
      /* istanbul ignore next */
      throw new Error('Something went wrong.');
    }

    const options = sb.pushValueOptions(optionsIn);
    if (!visited) {
      const expr = tsUtils.expression.getExpression(node);
      if (!ts.isElementAccessExpression(expr) && !ts.isPropertyAccessExpression(expr)) {
        /* istanbul ignore next */
        throw new Error('Something went wrong');
      }

      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(expr), options);
    }

    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [objectVal, arr]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.arrMapFunc);
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
