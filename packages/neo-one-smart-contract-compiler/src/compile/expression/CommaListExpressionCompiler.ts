import { CommaListExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class CommaListExpressionCompiler extends NodeCompiler<CommaListExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.CommaListExpression;

  public visitNode(sb: ScriptBuilder, expr: CommaListExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
