import { SyntaxKind, TaggedTemplateExpression } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TaggedTemplateExpressionCompiler extends NodeCompiler<TaggedTemplateExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.TaggedTemplateExpression;
  public visitNode(sb: ScriptBuilder, expr: TaggedTemplateExpression, _options: VisitOptions): void {
    sb.reportUnsupported(expr);
  }
}
