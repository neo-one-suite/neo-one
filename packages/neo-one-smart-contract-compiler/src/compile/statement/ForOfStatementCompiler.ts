import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForOfStatementCompiler extends NodeCompiler<ts.ForOfStatement> {
  public readonly kind = ts.SyntaxKind.ForOfStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForOfStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
