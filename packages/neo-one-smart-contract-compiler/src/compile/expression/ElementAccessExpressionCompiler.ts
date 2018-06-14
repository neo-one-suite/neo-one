import { ElementAccessExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ElementAccessExpressionCompiler extends NodeCompiler<ElementAccessExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.ElementAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ElementAccessExpression, options: VisitOptions): void {
    const value = expr.getExpression();

    // [val]
    sb.visit(value, sb.pushValueOptions(sb.noSetValueOptions(options)));
    // [val]
    sb.emitHelper(expr, options, sb.helpers.elementAccess);
  }
}
