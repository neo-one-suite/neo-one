import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TaggedTemplateExpressionCompiler extends NodeCompiler<ts.TaggedTemplateExpression> {
  public readonly kind = ts.SyntaxKind.TaggedTemplateExpression;

  public visitNode(sb: ScriptBuilder, node: ts.TaggedTemplateExpression, options: VisitOptions): void {
    sb.emitHelper(node, options, sb.helpers.callLike);
  }
}
