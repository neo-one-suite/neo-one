import { SyntaxKind, TypeOfExpression } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeOfExpressionCompiler extends NodeCompiler<TypeOfExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.TypeOfExpression;

  public visitNode(sb: ScriptBuilder, expr: TypeOfExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
