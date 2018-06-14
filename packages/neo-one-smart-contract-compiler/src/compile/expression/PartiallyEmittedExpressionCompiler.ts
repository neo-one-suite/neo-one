import { PartiallyEmittedExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PartiallyEmittedExpressionCompiler extends NodeCompiler<PartiallyEmittedExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.PartiallyEmittedExpression;

  public visitNode(sb: ScriptBuilder, expr: PartiallyEmittedExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
