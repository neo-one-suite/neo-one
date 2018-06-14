import { CaseBlock, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CaseBlockCompiler extends NodeCompiler<CaseBlock> {
  public readonly kind: SyntaxKind = SyntaxKind.CaseBlock;

  public visitNode(sb: ScriptBuilder, node: CaseBlock, options: VisitOptions): void {
    node.getClauses().forEach((clause) => {
      sb.visit(clause, options);
    });
  }
}
