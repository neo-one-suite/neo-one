import { EnumDeclaration, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EnumDeclarationCompiler extends NodeCompiler<EnumDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.EnumDeclaration;

  public visitNode(sb: ScriptBuilder, decl: EnumDeclaration, _options: VisitOptions): void {
    sb.reportUnsupported(decl);
  }
}
