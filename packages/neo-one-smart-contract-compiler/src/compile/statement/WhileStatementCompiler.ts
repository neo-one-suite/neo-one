import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class WhileStatementCompiler extends NodeCompiler<ts.WhileStatement> {
  public readonly kind = ts.SyntaxKind.WhileStatement;

  public visitNode(sb: ScriptBuilder, node: ts.WhileStatement, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    sb.emitHelper(
      node,
      sb.noPushValueOptions(options),
      sb.helpers.forLoop({
        condition: () => {
          const expr = tsUtils.expression.getExpression(node);
          sb.visit(expr, options);
          sb.emitHelper(node, options, sb.helpers.toBoolean({ type: sb.getType(expr) }));
        },
        each: (innerOptions) => {
          sb.visit(tsUtils.statement.getStatement(node), innerOptions);
        },
      }),
    );
  }
}
