import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableStatementCompiler extends NodeCompiler<ts.VariableStatement> {
  public readonly kind = ts.SyntaxKind.VariableStatement;

  public visitNode(sb: ScriptBuilder, node: ts.VariableStatement, optionsIn: VisitOptions): void {
    sb.visit(tsUtils.variable.getDeclarationList(node), optionsIn);

    if (tsUtils.modifier.isNamedExport(node)) {
      const options = sb.pushValueOptions(optionsIn);

      // [exports]
      sb.emitHelper(node, options, sb.helpers.getCurrentModule);
      tsUtils.variable.getDeclarations(tsUtils.variable.getDeclarationList(node)).forEach((decl) => {
        const name = tsUtils.node.getName(decl);
        if (name !== undefined) {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [val, exports, exports]
          sb.scope.get(sb, node, options, name);
          // [exports]
          sb.emitHelper(node, options, sb.helpers.export({ name: tsUtils.node.getName(decl) }));
        }
      });
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
