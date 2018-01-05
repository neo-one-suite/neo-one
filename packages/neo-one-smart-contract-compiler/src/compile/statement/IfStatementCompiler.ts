import { IfStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class IfStatementCompiler extends NodeCompiler<IfStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.IfStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: IfStatement,
    options: VisitOptions,
  ): void {
    const condition = () => {
      const cond = node.getExpression();
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
      sb.visit(node.getThenStatement(), options);
    };

    let whenFalse;
    const nodeWhenFalse = node.getElseStatement();
    if (nodeWhenFalse != null) {
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
