import { ExpressionStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExpressionStatementCompiler extends NodeCompiler<ExpressionStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.ExpressionStatement;

  public visitNode(sb: ScriptBuilder, node: ExpressionStatement, options: VisitOptions): void {
    sb.visit(node.getExpression(), sb.noPushValueOptions(options));
  }
}
