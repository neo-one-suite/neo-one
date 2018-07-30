import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExpressionStatementCompiler extends NodeCompiler<ts.ExpressionStatement> {
  public readonly kind = ts.SyntaxKind.ExpressionStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ExpressionStatement, options: VisitOptions): void {
    sb.visit(tsUtils.expression.getExpression(node), sb.noPushValueOptions(options));
  }
}
