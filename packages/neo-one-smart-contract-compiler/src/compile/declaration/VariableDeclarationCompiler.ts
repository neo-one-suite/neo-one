import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { handleTypeAssignment } from '../helper/types';
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

      if (expr === undefined) {
        if (!options.setValue) {
          sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.wrapUndefined);
        }
      } else {
        sb.visit(expr, sb.pushValueOptions(options));
        if (ts.isIdentifier(nameNode)) {
          handleTypeAssignment(sb.context, expr, node);
        }
      }

      sb.scope.set(sb, node, options, tsUtils.node.getText(nameNode));
    } else if (ts.isArrayBindingPattern(nameNode)) {
      sb.emitHelper(
        nameNode,
        options,
        sb.helpers.arrayBinding({
          type: expr === undefined ? undefined : sb.context.analysis.getType(expr),
          value: expr,
        }),
      );
    } else {
      sb.emitHelper(
        nameNode,
        options,
        sb.helpers.objectBinding({
          type: expr === undefined ? undefined : sb.context.analysis.getType(expr),
          value: expr,
        }),
      );
    }
  }
}
