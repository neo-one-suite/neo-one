import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DoStatementCompiler extends NodeCompiler<ts.DoStatement> {
  public readonly kind = ts.SyntaxKind.DoStatement;

  public visitNode(sb: ScriptBuilder, node: ts.DoStatement, options: VisitOptions): void {
    sb.withProgramCounter((pc) => {
      sb.withProgramCounter((innerPC) => {
        sb.visit(
          tsUtils.statement.getStatement(node),
          sb.breakPCOptions(sb.continuePCOptions(options, innerPC.getLast()), pc.getLast()),
        );
      });

      sb.emitHelper(
        tsUtils.expression.getExpression(node),
        options,
        sb.helpers.if({
          condition: () => {
            sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
          },
          whenTrue: () => {
            sb.emitJmp(node, 'JMP', pc.getFirst());
          },
        }),
      );
    });
  }
}
