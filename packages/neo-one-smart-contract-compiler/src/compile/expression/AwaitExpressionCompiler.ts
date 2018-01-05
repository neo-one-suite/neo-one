import { AwaitExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';

export default class AwaitExpressionCompiler extends NodeCompiler<
  AwaitExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.AwaitExpression;

  public visitNode(sb: ScriptBuilder, expr: AwaitExpression): void {
    sb.reportUnsupported(expr);
  }
}
