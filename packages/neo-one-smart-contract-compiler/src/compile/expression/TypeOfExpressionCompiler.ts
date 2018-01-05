import { TypeOfExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class TypeOfExpressionCompiler extends NodeCompiler<
  TypeOfExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.TypeOfExpression;

  public visitNode(
    sb: ScriptBuilder,
    expr: TypeOfExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
