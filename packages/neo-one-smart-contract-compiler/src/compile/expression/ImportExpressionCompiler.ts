import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ImportExpressionCompiler extends NodeCompiler<ts.ImportExpression> {
  public readonly kind = ts.SyntaxKind.ImportKeyword;

  public visitNode(sb: ScriptBuilder, expr: ts.ImportExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
