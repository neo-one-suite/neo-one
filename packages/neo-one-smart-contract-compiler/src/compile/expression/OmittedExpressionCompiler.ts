import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class OmittedExpressionCompiler extends NodeCompiler<ts.OmittedExpression> {
  public readonly kind = ts.SyntaxKind.OmittedExpression;

  public visitNode(_sb: ScriptBuilder, _expr: ts.OmittedExpression, _options: VisitOptions): void {
    // do nothing
  }
}
