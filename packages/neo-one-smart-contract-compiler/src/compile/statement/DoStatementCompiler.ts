import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import * as constants from '../../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DoStatementCompiler extends NodeCompiler<ts.DoStatement> {
  public readonly kind = ts.SyntaxKind.DoStatement;

  public visitNode(sb: ScriptBuilder, node: ts.DoStatement, options: VisitOptions): void {
    sb.withProgramCounter((breakPC) => {
      sb.withProgramCounter((continuePC) => {
        sb.visit(
          tsUtils.statement.getStatement(node),
          sb.breakPCOptions(sb.continuePCOptions(options, continuePC.getLast()), breakPC.getLast()),
        );

        sb.emitPushInt(node, constants.CONTINUE_COMPLETION);
      });
      // []
      sb.emitOp(node, 'DROP');

      sb.emitHelper(
        tsUtils.expression.getExpression(node),
        options,
        sb.helpers.if({
          condition: () => {
            const expr = tsUtils.expression.getExpression(node);
            sb.visit(expr, sb.pushValueOptions(options));
            sb.emitHelper(
              expr,
              sb.pushValueOptions(options),
              sb.helpers.toBoolean({ type: sb.context.analysis.getType(expr) }),
            );
          },
          whenTrue: () => {
            sb.emitJmp(node, 'JMP', breakPC.getFirst());
          },
        }),
      );

      sb.emitPushInt(node, constants.BREAK_COMPLETION);
    });

    // []
    sb.emitOp(node, 'DROP');
  }
}
