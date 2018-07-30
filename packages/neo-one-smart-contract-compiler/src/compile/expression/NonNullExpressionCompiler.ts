import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NonNullExpressionCompiler extends NodeCompiler<ts.NonNullExpression> {
  public readonly kind = ts.SyntaxKind.NonNullExpression;

  public visitNode(_sb: ScriptBuilder, _expr: ts.NonNullExpression, _options: VisitOptions): void {
    // do nothing
  }
}
