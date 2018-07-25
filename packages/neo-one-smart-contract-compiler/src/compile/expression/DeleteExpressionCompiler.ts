import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DeleteExpressionCompiler extends NodeCompiler<ts.DeleteExpression> {
  public readonly kind = ts.SyntaxKind.DeleteExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.DeleteExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
