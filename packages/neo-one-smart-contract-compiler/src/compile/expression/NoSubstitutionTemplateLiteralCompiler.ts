import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NoSubstitutionTemplateLiteralCompiler extends NodeCompiler<ts.NoSubstitutionTemplateLiteral> {
  public readonly kind = ts.SyntaxKind.NoSubstitutionTemplateLiteral;

  public visitNode(sb: ScriptBuilder, expr: ts.NoSubstitutionTemplateLiteral, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
