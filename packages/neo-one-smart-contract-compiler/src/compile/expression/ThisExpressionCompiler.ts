import { SyntaxKind, ThisExpression } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ThisExpressionCompiler extends NodeCompiler<
  ThisExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.ThisKeyword;

  public visitNode(
    sb: ScriptBuilder,
    expr: ThisExpression,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      sb.scope.getThis(sb, expr, options);
    }
  }
}
