import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class AsExpressionCompiler extends NodeCompiler<ts.AsExpression> {
  public readonly kind = ts.SyntaxKind.AsExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.AsExpression, options: VisitOptions): void {
    const type = sb.context.getType(expr);
    if (options.cast !== undefined && type === undefined) {
      sb.visit(tsUtils.expression.getExpression(expr), options);
    } else {
      sb.visit(tsUtils.expression.getExpression(expr), sb.castOptions(options, type));
    }
  }
}
