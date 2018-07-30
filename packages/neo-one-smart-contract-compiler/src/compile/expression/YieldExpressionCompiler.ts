import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class YieldExpressionCompiler extends NodeCompiler<ts.YieldExpression> {
  public readonly kind = ts.SyntaxKind.YieldExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.YieldExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
