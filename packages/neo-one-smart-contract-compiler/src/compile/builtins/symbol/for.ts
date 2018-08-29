import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class SymbolFor extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const arg = tsUtils.argumented.getArguments(node)[0];
    // [stringVal]
    sb.visit(arg, sb.pushValueOptions(options));
    // [string]
    sb.emitHelper(arg, sb.pushValueOptions(options), sb.helpers.toString({ type: sb.context.analysis.getType(arg) }));
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.wrapSymbol);
  }
}
