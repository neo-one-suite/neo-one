import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ThisExpressionCompiler extends NodeCompiler<ts.ThisExpression> {
  public readonly kind = ts.SyntaxKind.ThisKeyword;

  public visitNode(sb: ScriptBuilder, expr: ts.ThisExpression, options: VisitOptions): void {
    if (options.pushValue) {
      sb.scope.getThis(sb, expr, options);
    }
  }
}
