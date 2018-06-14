import { DeleteExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class DeleteExpressionCompiler extends NodeCompiler<DeleteExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.DeleteExpression;

  public visitNode(sb: ScriptBuilder, expr: DeleteExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
