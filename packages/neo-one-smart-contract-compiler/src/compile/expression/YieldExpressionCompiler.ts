import { SyntaxKind, YieldExpression } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class YieldExpressionCompiler extends NodeCompiler<
  YieldExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.YieldExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: YieldExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
