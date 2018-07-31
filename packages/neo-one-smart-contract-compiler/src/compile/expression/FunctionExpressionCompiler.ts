import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionExpressionCompiler extends NodeCompiler<ts.FunctionExpression> {
  public readonly kind = ts.SyntaxKind.FunctionExpression;

  public visitNode(sb: ScriptBuilder, node: ts.FunctionExpression, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.functionLike);
  }
}
