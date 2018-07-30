import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EnumMemberCompiler extends NodeCompiler<ts.EnumMember> {
  public readonly kind = ts.SyntaxKind.EnumMember;

  public visitNode(sb: ScriptBuilder, decl: ts.EnumMember, _options: VisitOptions): void {
    sb.reportUnsupported(decl);
  }
}
