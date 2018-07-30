import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class IfStatementCompiler extends NodeCompiler<ts.IfStatement> {
  public readonly kind = ts.SyntaxKind.IfStatement;

  public visitNode(sb: ScriptBuilder, node: ts.IfStatement, options: VisitOptions): void {
    const condition = () => {
      const cond = tsUtils.expression.getExpression(node);
      sb.visit(cond, sb.pushValueOptions(options));
      sb.emitHelper(
        cond,
        sb.pushValueOptions(options),
        sb.helpers.toBoolean({
          type: sb.getType(cond),
        }),
      );
    };

    const whenTrue = () => {
      sb.visit(tsUtils.statement.getThenStatement(node), options);
    };

    let whenFalse;
    const nodeWhenFalse = tsUtils.statement.getElseStatement(node);
    if (nodeWhenFalse !== undefined) {
      whenFalse = () => {
        sb.visit(nodeWhenFalse, options);
      };
    }

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition,
        whenTrue,
        whenFalse,
      }),
    );
  }
}
