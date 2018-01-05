import { NoSubstitutionTemplateLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class NoSubstitutionTemplateLiteralCompiler extends NodeCompiler<
  NoSubstitutionTemplateLiteral
> {
  public readonly kind: SyntaxKind = SyntaxKind.NoSubstitutionTemplateLiteral;

  public visitNode(
    sb: ScriptBuilder,
    expr: NoSubstitutionTemplateLiteral,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
