import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForInStatementCompiler extends NodeCompiler<ts.ForInStatement> {
  public readonly kind = ts.SyntaxKind.ForInStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForInStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
