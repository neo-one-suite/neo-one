import { SuperExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SuperExpressionCompiler extends NodeCompiler<SuperExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.SuperKeyword;

  public visitNode(sb: ScriptBuilder, expr: SuperExpression, options: VisitOptions): void {
    if (options.pushValue) {
      const superClass = options.superClass;
      if (superClass === undefined) {
        throw new Error('Something went wrong, expected super class to be defined.');
      }

      // [superClass]
      sb.scope.get(sb, expr, options, superClass);
      // ['prototype', superClass]
      sb.emitPushString(expr, 'prototype');
      // [superPrototype]
      sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);
    }
  }
}
