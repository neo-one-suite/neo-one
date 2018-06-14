import { FunctionExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionExpressionCompiler extends NodeCompiler<FunctionExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.FunctionExpression;

  public visitNode(sb: ScriptBuilder, expr: FunctionExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
