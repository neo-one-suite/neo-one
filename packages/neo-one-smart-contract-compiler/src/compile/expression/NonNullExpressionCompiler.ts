import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NonNullExpressionCompiler extends NodeCompiler<ts.NonNullExpression> {
  public readonly kind = ts.SyntaxKind.NonNullExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.NonNullExpression, options: VisitOptions): void {
    sb.visit(tsUtils.expression.getExpression(expr), options);
  }
}
