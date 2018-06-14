import { DoStatement, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DoStatementCompiler extends NodeCompiler<DoStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.DoStatement;

  public visitNode(sb: ScriptBuilder, node: DoStatement, options: VisitOptions): void {
    sb.withProgramCounter((pc) => {
      sb.withProgramCounter((innerPC) => {
        sb.visit(
          node.getStatement(),
          sb.breakPCOptions(sb.continuePCOptions(options, innerPC.getLast()), pc.getLast()),
        );
      });

      sb.emitHelper(
        node.getExpression(),
        options,
        sb.helpers.if({
          condition: () => {
            sb.visit(node.getExpression(), sb.pushValueOptions(options));
          },
          whenTrue: () => {
            sb.emitJmp(node, 'JMP', pc.getFirst());
          },
        }),
      );
    });
  }
}
