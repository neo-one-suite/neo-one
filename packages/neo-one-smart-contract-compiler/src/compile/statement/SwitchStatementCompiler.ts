import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SwitchStatementCompiler extends NodeCompiler<ts.SwitchStatement> {
  public readonly kind = ts.SyntaxKind.SwitchStatement;

  public visitNode(sb: ScriptBuilder, node: ts.SwitchStatement, options: VisitOptions): void {
    sb.withProgramCounter((pc) => {
      sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
      sb.visit(tsUtils.statement.getCaseBlock(node), sb.breakPCOptions(options, pc.getLast()));
    });
  }
}
