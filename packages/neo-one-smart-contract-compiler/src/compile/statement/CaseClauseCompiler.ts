import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CaseClauseCompiler extends NodeCompiler<ts.CaseClause> {
  public readonly kind = ts.SyntaxKind.CaseClause;

  public visitNode(sb: ScriptBuilder, node: ts.CaseClause, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
