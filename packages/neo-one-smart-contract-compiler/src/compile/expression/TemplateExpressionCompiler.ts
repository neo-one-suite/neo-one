import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TemplateExpressionCompiler extends NodeCompiler<ts.TemplateExpression> {
  public readonly kind = ts.SyntaxKind.TemplateExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.TemplateExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
