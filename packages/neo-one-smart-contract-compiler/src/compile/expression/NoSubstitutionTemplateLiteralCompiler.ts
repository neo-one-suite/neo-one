import { NoSubstitutionTemplateLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NoSubstitutionTemplateLiteralCompiler extends NodeCompiler<NoSubstitutionTemplateLiteral> {
  public readonly kind: SyntaxKind = SyntaxKind.NoSubstitutionTemplateLiteral;

  public visitNode(sb: ScriptBuilder, expr: NoSubstitutionTemplateLiteral, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
