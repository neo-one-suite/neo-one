import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ThrowStatementCompiler extends NodeCompiler<ts.ThrowStatement> {
  public readonly kind = ts.SyntaxKind.ThrowStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ThrowStatement, options: VisitOptions): void {
    const expr = tsUtils.expression.getExpression(node);
    if (expr === undefined) {
      sb.reportUnsupported(node);
    } else {
      sb.visit(expr, sb.pushValueOptions(options));
    }
    sb.emitHelper(node, options, sb.helpers.throw);
  }
}
