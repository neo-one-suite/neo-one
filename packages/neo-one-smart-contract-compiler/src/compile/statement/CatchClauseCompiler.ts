import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CatchClauseCompiler extends NodeCompiler<ts.CatchClause> {
  public readonly kind = ts.SyntaxKind.CatchClause;

  public visitNode(sb: ScriptBuilder, node: ts.CatchClause, options: VisitOptions): void {
    const variable = tsUtils.statement.getOnlyVariableDeclaration(node);
    if (variable === undefined) {
      sb.visit(tsUtils.statement.getBlock(node), options);
    } else {
      sb.withScope(node, options, (innerOptions) => {
        sb.visit(variable, innerOptions);
        sb.visit(tsUtils.statement.getBlock(node), innerOptions);
      });
    }
  }
}
