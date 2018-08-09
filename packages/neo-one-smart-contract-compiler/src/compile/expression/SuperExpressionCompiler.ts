import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SuperExpressionCompiler extends NodeCompiler<ts.SuperExpression> {
  public readonly kind = ts.SyntaxKind.SuperKeyword;

  public visitNode(sb: ScriptBuilder, node: ts.SuperExpression, options: VisitOptions): void {
    if (options.pushValue) {
      const superClass = options.superClass;
      if (superClass === undefined) {
        /* istanbul ignore next */
        throw new Error('Something went wrong, expected super class to be defined.');
      }

      const methodDeclaration = tsUtils.node.getFirstAncestorByKind(node, ts.SyntaxKind.MethodDeclaration);
      /* istanbul ignore next */
      if (methodDeclaration === undefined) {
        /* istanbul ignore next */
        sb.context.reportUnsupported(node);

        /* istanbul ignore next */
        return;
      }

      // [superClass]
      sb.scope.get(sb, node, options, superClass);
      if (!tsUtils.modifier.isStatic(methodDeclaration)) {
        // ['prototype', superClass]
        sb.emitPushString(node, 'prototype');
        // [superPrototype]
        sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
      }
    }
  }
}
