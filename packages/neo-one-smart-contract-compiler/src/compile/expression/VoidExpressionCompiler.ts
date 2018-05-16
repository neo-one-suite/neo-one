import { VoidExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class VoidExpressionCompiler extends NodeCompiler<
  VoidExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.VoidExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: VoidExpression,
    options: VisitOptions,
  ): void {
    if (options.pushValue) {
      sb.emitHelper(expr, options, sb.helpers.createUndefined);
    }
  }
}
