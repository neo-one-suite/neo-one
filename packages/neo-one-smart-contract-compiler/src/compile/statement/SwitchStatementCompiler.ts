import { SwitchStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SwitchStatementCompiler extends NodeCompiler<SwitchStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.SwitchStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: SwitchStatement,
    options: VisitOptions,
  ): void {
    sb.withProgramCounter((pc) => {
      sb.visit(node.getExpression(), sb.pushValueOptions(options));
      sb.visit(node.getCaseBlock(), sb.breakPCOptions(options, pc.getLast()));
    });
  }
}
