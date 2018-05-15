import { ConditionalExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ConditionalExpressionCompiler extends NodeCompiler<
  ConditionalExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.ConditionalExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: ConditionalExpression,
    options: VisitOptions,
  ): void {
    sb.emitHelper(
      expr,
      options,
      sb.helpers.if({
        condition: () => {
          // [val]
          sb.visit(expr.getCondition(), sb.pushValueOptions(options));
          // [boolean]
          sb.emitHelper(
            expr.getCondition(),
            sb.pushValueOptions(options),
            sb.helpers.toBoolean({
              type: sb.getType(expr.getCondition()),
            }),
          );
        },
        whenTrue: () => {
          sb.visit(expr.getWhenTrue(), options);
        },
        whenFalse: () => {
          sb.visit(expr.getWhenFalse(), options);
        },
      }),
    );
  }
}
