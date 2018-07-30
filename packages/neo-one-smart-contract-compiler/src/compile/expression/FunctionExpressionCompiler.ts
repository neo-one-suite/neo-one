import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionExpressionCompiler extends NodeCompiler<ts.FunctionExpression> {
  public readonly kind = ts.SyntaxKind.FunctionExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.FunctionExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
