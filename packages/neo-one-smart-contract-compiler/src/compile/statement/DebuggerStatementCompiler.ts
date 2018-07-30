import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DebuggerStatementCompiler extends NodeCompiler<ts.DebuggerStatement> {
  public readonly kind = ts.SyntaxKind.DebuggerStatement;

  public visitNode(sb: ScriptBuilder, node: ts.DebuggerStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
