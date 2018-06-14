import { NonNullExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NonNullExpressionCompiler extends NodeCompiler<NonNullExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.NonNullExpression;
  public visitNode(sb: ScriptBuilder, expr: NonNullExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
