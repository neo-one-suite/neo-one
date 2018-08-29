import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ConditionalExpressionCompiler extends NodeCompiler<ts.ConditionalExpression> {
  public readonly kind = ts.SyntaxKind.ConditionalExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.ConditionalExpression, options: VisitOptions): void {
    sb.emitHelper(
      expr,
      options,
      sb.helpers.if({
        condition: () => {
          const condition = tsUtils.expression.getCondition(expr);
          // [val]
          sb.visit(condition, sb.pushValueOptions(options));
          // [boolean]
          sb.emitHelper(
            condition,
            sb.pushValueOptions(options),
            sb.helpers.toBoolean({
              type: sb.context.analysis.getType(condition),
            }),
          );
        },
        whenTrue: () => {
          sb.visit(tsUtils.expression.getWhenTrue(expr), options);
        },
        whenFalse: () => {
          sb.visit(tsUtils.expression.getWhenFalse(expr), options);
        },
      }),
    );
  }
}
