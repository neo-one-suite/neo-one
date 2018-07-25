import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CaseBlockCompiler extends NodeCompiler<ts.CaseBlock> {
  public readonly kind = ts.SyntaxKind.CaseBlock;

  public visitNode(sb: ScriptBuilder, node: ts.CaseBlock, options: VisitOptions): void {
    tsUtils.statement.getClauses(node).forEach((clause) => {
      sb.visit(clause, options);
    });
  }
}
