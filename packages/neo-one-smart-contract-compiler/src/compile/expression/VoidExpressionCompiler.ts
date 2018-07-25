import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class VoidExpressionCompiler extends NodeCompiler<ts.VoidExpression> {
  public readonly kind = ts.SyntaxKind.VoidExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.VoidExpression, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitHelper(expr, options, sb.helpers.createUndefined);
    }
  }
}
