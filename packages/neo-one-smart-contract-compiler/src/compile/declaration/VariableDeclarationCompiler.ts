import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VariableDeclarationCompiler extends NodeCompiler<ts.VariableDeclaration> {
  public readonly kind = ts.SyntaxKind.VariableDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.VariableDeclaration, options: VisitOptions): void {
    const nameNode = tsUtils.node.getNameNode(node);
    if (ts.isArrayBindingPattern(nameNode) || ts.isObjectBindingPattern(nameNode)) {
      sb.reportUnsupported(node);
    } else {
      const name = sb.scope.add(tsUtils.node.getNameOrThrow(node));
      const expr = tsUtils.initializer.getInitializer(node);
      if (expr !== undefined) {
        sb.visit(expr, sb.pushValueOptions(options));
        sb.scope.set(sb, node, options, name);
      }
    }
  }
}
