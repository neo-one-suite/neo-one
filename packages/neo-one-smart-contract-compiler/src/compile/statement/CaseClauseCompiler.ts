import { CaseClause, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CaseClauseCompiler extends NodeCompiler<CaseClause> {
  public readonly kind: SyntaxKind = SyntaxKind.CaseClause;

  public visitNode(
    sb: ScriptBuilder,
    node: CaseClause,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(node);
  }
}
