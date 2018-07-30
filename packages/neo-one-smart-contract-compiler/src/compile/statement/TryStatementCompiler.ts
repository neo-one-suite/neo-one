import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TryStatementCompiler extends NodeCompiler<ts.TryStatement> {
  public readonly kind = ts.SyntaxKind.TryStatement;

  public visitNode(sb: ScriptBuilder, node: ts.TryStatement, options: VisitOptions): void {
    const catchClause = tsUtils.statement.getCatchClause(node);
    if (catchClause === undefined) {
      sb.visit(tsUtils.statement.getTryBlock(node), options);
    } else {
      sb.withProgramCounter((pc) => {
        sb.withProgramCounter((innerPC) => {
          sb.visit(tsUtils.statement.getTryBlock(node), sb.catchPCOptions(options, innerPC.getLast()));
          sb.emitJmp(node, 'JMP', pc.getLast());
        });

        sb.visit(catchClause, options);
      });
    }

    const finallyBlock = tsUtils.statement.getFinallyBlock(node);
    if (finallyBlock !== undefined) {
      sb.reportUnsupported(finallyBlock);
    }
  }
}
