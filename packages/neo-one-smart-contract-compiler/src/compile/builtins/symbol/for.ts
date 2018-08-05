import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinBase, BuiltinCall, BuiltinType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class SymbolFor extends BuiltinBase implements BuiltinCall {
  public readonly types = new Set([BuiltinType.Call]);

  public canCall(): boolean {
    throw new Error('Something went wrong.');
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      /* istanbul ignore next */
      throw new Error('Something went wrong.');
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    // [stringVal]
    sb.visit(arg, sb.pushValueOptions(options));
    // [string]
    sb.emitHelper(arg, sb.pushValueOptions(options), sb.helpers.toString({ type: sb.getType(arg) }));
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.createSymbol);
  }
}
