import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinBase, BuiltinCall, BuiltinType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayIterator extends BuiltinBase implements BuiltinCall {
  public readonly types = new Set([BuiltinType.Call]);

  public canCall(_sb: ScriptBuilder, node: CallLikeExpression): boolean {
    return ts.isCallExpression(node);
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

    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.createArrayIterableIterator);
  }
}
