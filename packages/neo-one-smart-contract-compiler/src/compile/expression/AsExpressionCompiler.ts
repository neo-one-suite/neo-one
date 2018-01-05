import { AsExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

import * as typeUtils from '../../typeUtils';

export default class AsExpressionCompiler extends NodeCompiler<AsExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.AsExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: AsExpression,
    options: VisitOptions,
  ): void {
    const type = sb.getType(expr);
    if (options.cast != null && typeUtils.isAnyType(type)) {
      sb.visit(expr.getExpression(), options);
    } else {
      sb.visit(expr.getExpression(), sb.castOptions(options, type));
    }
  }
}
