import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DefaultClauseCompiler extends NodeCompiler<ts.DefaultClause> {
  public readonly kind = ts.SyntaxKind.DefaultClause;

  public visitNode(sb: ScriptBuilder, node: ts.DefaultClause, options: VisitOptions): void {
    sb.emitOp(node, 'DROP');
    sb.emitHelper(node, options, sb.helpers.processStatements({ createScope: false }));
  }
}
