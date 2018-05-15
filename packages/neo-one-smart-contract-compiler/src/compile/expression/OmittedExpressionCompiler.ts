import { OmittedExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class OmittedExpressionCompiler extends NodeCompiler<
  OmittedExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.OmittedExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: OmittedExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
