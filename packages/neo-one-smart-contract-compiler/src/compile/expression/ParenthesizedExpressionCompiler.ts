import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ParenthesizedExpressionCompiler extends NodeCompiler<ts.ParenthesizedExpression> {
  public readonly kind = ts.SyntaxKind.ParenthesizedExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.ParenthesizedExpression, options: VisitOptions): void {
    sb.visit(tsUtils.expression.getExpression(expr), options);
  }
}
