import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EnumDeclarationCompiler extends NodeCompiler<ts.EnumDeclaration> {
  public readonly kind = ts.SyntaxKind.EnumDeclaration;

  public visitNode(sb: ScriptBuilder, decl: ts.EnumDeclaration, _options: VisitOptions): void {
    sb.context.reportUnsupported(decl);
  }
}
