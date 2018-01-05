import { CommaListExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class CommaListExpressionCompiler extends NodeCompiler<
  CommaListExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.CommaListExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: CommaListExpression,
    options: VisitOptions,
  ): void {
    // TODO: What is this??
    sb.reportUnsupported(expr);
  }
}
