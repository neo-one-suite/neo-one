import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class SymbolFor extends BuiltInBase implements BuiltInCall {
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

    return type !== undefined && tsUtils.type_.isOnlyStringish(type);
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      return;
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
