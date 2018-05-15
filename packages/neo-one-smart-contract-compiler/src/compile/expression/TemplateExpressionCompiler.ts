import { TemplateExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class TemplateExpressionCompiler extends NodeCompiler<
  TemplateExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.TemplateExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: TemplateExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
