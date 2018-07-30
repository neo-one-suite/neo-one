import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeOfExpressionCompiler extends NodeCompiler<ts.TypeOfExpression> {
  public readonly kind = ts.SyntaxKind.TypeOfExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.TypeOfExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
