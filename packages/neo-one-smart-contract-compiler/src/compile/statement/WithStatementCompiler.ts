import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class WithStatementCompiler extends NodeCompiler<ts.WithStatement> {
  public readonly kind = ts.SyntaxKind.WithStatement;

  public visitNode(sb: ScriptBuilder, node: ts.WithStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
