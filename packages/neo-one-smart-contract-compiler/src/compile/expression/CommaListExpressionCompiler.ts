import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CommaListExpressionCompiler extends NodeCompiler<ts.CommaListExpression> {
  public readonly kind = ts.SyntaxKind.CommaListExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.CommaListExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
