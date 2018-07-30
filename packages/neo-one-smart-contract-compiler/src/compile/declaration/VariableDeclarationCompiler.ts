import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableDeclarationCompiler extends NodeCompiler<ts.VariableDeclaration> {
  public readonly kind = ts.SyntaxKind.VariableDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.VariableDeclaration, options: VisitOptions): void {
    const nameNode = tsUtils.node.getNameNode(node);
    const expr = tsUtils.initializer.getInitializer(node);

    if (ts.isIdentifier(nameNode)) {
      sb.scope.add(tsUtils.node.getText(nameNode));
    }

    if (expr !== undefined) {
      sb.visit(expr, sb.pushValueOptions(options));

      if (ts.isIdentifier(nameNode)) {
        sb.scope.set(sb, node, options, tsUtils.node.getText(nameNode));
      } else {
        sb.visit(nameNode, options);
      }
    }
  }
}
