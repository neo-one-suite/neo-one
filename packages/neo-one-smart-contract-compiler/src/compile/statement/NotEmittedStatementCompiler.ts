import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NotEmittedStatementCompiler extends NodeCompiler<ts.NotEmittedStatement> {
  public readonly kind = ts.SyntaxKind.NotEmittedStatement;

  public visitNode(sb: ScriptBuilder, node: ts.NotEmittedStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
