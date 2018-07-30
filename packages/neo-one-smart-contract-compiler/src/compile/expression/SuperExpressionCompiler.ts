import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SuperExpressionCompiler extends NodeCompiler<ts.SuperExpression> {
  public readonly kind = ts.SyntaxKind.SuperKeyword;

  public visitNode(sb: ScriptBuilder, expr: ts.SuperExpression, options: VisitOptions): void {
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
