import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class WhileStatementCompiler extends NodeCompiler<ts.WhileStatement> {
  public readonly kind = ts.SyntaxKind.WhileStatement;

  public visitNode(sb: ScriptBuilder, node: ts.WhileStatement, options: VisitOptions): void {
    sb.withProgramCounter((pc) => {
      sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
      sb.emitJmp(node, 'JMPIFNOT', pc.getLast());
      sb.visit(
        tsUtils.statement.getStatement(node),
        sb.breakPCOptions(sb.continuePCOptions(options, pc.getFirst()), pc.getLast()),
      );
      sb.emitJmp(node, 'JMP', pc.getFirst());
    });
  }
}
