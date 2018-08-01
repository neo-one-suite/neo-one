import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TemplateExpressionCompiler extends NodeCompiler<ts.TemplateExpression> {
  public readonly kind = ts.SyntaxKind.TemplateExpression;

  public visitNode(sb: ScriptBuilder, node: ts.TemplateExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const head = tsUtils.template.getTemplateHead(node);
    // [string]
    sb.emitPushString(head, tsUtils.literal.getLiteralValue(head));
    tsUtils.template.getTemplateSpans(node).forEach((span) => {
      const expr = tsUtils.expression.getExpression(span);
      // [val, accumString]
      sb.visit(expr, options);
      // [string, accumString]
      sb.emitHelper(expr, options, sb.helpers.toString({ type: sb.getType(expr) }));
      // [accumString]
      sb.emitOp(expr, 'CAT');
      const spanLiteral = tsUtils.template.getLiteral(span);
      // [string, accumString]
      sb.emitPushString(spanLiteral, tsUtils.literal.getLiteralValue(spanLiteral));
      // [accumString]
      sb.emitOp(expr, 'CAT');
    });
    if (optionsIn.pushValue) {
      sb.emitHelper(node, options, sb.helpers.createString);
    } else {
      sb.emitOp(node, 'DROP');
    }
  }
}
