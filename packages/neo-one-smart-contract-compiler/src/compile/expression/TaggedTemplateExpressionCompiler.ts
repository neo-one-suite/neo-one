import { TaggedTemplateExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class TaggedTemplateExpressionCompiler extends NodeCompiler<
  TaggedTemplateExpression
  > {
  public readonly kind: SyntaxKind = SyntaxKind.TaggedTemplateExpression;
  public visitNode(
    sb: ScriptBuilder,
    expr: TaggedTemplateExpression,
    options: VisitOptions,
  ): void {
    sb.reportUnsupported(expr);
  }
}
