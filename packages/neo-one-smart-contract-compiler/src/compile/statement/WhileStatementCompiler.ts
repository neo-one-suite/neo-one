import { SyntaxKind, WhileStatement } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class WhileStatementCompiler extends NodeCompiler<WhileStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.WhileStatement;

  public visitNode(sb: ScriptBuilder, node: WhileStatement, options: VisitOptions): void {
    sb.withProgramCounter((pc) => {
      sb.visit(node.getExpression(), sb.pushValueOptions(options));
      sb.emitJmp(node, 'JMPIFNOT', pc.getLast());
      sb.visit(node.getStatement(), sb.breakPCOptions(sb.continuePCOptions(options, pc.getFirst()), pc.getLast()));
      sb.emitJmp(node, 'JMP', pc.getFirst());
    });
  }
}
