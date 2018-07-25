import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PartiallyEmittedExpressionCompiler extends NodeCompiler<ts.PartiallyEmittedExpression> {
  public readonly kind = ts.SyntaxKind.PartiallyEmittedExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PartiallyEmittedExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
