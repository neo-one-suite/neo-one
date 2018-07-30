import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class LabeledStatementCompiler extends NodeCompiler<ts.LabeledStatement> {
  public readonly kind = ts.SyntaxKind.LabeledStatement;

  public visitNode(sb: ScriptBuilder, node: ts.LabeledStatement, _options: VisitOptions): void {
    sb.reportUnsupported(node);
  }
}
