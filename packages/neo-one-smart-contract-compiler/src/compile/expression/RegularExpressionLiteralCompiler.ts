import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class RegularExpressionLiteralCompiler extends NodeCompiler<ts.RegularExpressionLiteral> {
  public readonly kind = ts.SyntaxKind.RegularExpressionLiteral;
  public visitNode(sb: ScriptBuilder, expr: ts.RegularExpressionLiteral, _options: VisitOptions): void {
    sb.context.reportUnsupported(expr);
  }
}
