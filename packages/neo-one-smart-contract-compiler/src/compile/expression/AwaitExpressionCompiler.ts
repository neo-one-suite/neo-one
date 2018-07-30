import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';

export class AwaitExpressionCompiler extends NodeCompiler<ts.AwaitExpression> {
  public readonly kind = ts.SyntaxKind.AwaitExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.AwaitExpression): void {
    sb.reportUnsupported(expr);
  }
}
