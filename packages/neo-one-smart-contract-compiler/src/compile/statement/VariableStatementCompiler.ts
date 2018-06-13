import { SyntaxKind, VariableStatement } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableStatementCompiler extends NodeCompiler<VariableStatement> {
  public readonly kind: SyntaxKind = SyntaxKind.VariableStatement;

  public visitNode(
    sb: ScriptBuilder,
    node: VariableStatement,
    optionsIn: VisitOptions,
  ): void {
    sb.visit(node.getDeclarationList(), optionsIn);

    if (node.isNamedExport()) {
      const options = sb.pushValueOptions(optionsIn);

      // [exports]
      sb.emitHelper(node, options, sb.helpers.getCurrentModule);
      node
        .getDeclarationList()
        .getDeclarations()
        .forEach((decl) => {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [val, exports, exports]
          sb.scope.get(sb, node, options, decl.getName());
          // [exports]
          sb.emitHelper(
            node,
            options,
            sb.helpers.export({ name: decl.getName() }),
          );
        });
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
