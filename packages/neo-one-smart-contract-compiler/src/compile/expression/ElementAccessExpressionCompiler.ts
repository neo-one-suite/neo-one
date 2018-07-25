import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ElementAccessExpressionCompiler extends NodeCompiler<ts.ElementAccessExpression> {
  public readonly kind = ts.SyntaxKind.ElementAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.ElementAccessExpression, options: VisitOptions): void {
    const value = tsUtils.expression.getExpression(expr);

    // [val]
    sb.visit(value, sb.pushValueOptions(sb.noSetValueOptions(options)));
    // [val]
    sb.emitHelper(expr, options, sb.helpers.elementAccess);
  }
}
