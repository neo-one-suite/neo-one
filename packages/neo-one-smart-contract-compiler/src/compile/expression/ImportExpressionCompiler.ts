import { ImportExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ImportExpressionCompiler extends NodeCompiler<
  ImportExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.ImportKeyword;

  public visitNode(
    sb: ScriptBuilder,
    expr: ImportExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
