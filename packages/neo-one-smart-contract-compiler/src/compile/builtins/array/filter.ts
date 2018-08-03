import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class ArrayFilter extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const expr = tsUtils.expression.getExpression(node);
    if (!ts.isPropertyAccessExpression(expr)) {
      /* istanbul ignore next */
      throw new Error('Something went wrong');
    }

    // [arrayVal]
    sb.visit(tsUtils.expression.getExpression(expr), options);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.unwrapArray);
    // [objectVal, arr]
    sb.visit(tsUtils.argumented.getArguments(node)[0], options);
    // [arr]
    sb.emitHelper(node, options, sb.helpers.arrFilterFunc);
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
