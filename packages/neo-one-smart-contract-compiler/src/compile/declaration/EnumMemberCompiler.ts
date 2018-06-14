import { EnumMember, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class EnumMemberCompiler extends NodeCompiler<EnumMember> {
  public readonly kind: SyntaxKind = SyntaxKind.EnumMember;

  public visitNode(sb: ScriptBuilder, decl: EnumMember, _options: VisitOptions): void {
    sb.reportUnsupported(decl);
  }
}
