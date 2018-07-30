import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ReturnStatementCompiler extends NodeCompiler<ts.ReturnStatement> {
  public readonly kind = ts.SyntaxKind.ReturnStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ReturnStatement, options: VisitOptions): void {
    const expr = tsUtils.expression.getExpression(node);
    if (expr === undefined) {
      sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createUndefined);
    } else {
      sb.visit(expr, sb.pushValueOptions(options));
    }

    sb.emitHelper(node, sb.pushValueOptions(options), sb.helpers.createNormalCompletion);
    sb.emitOp(node, 'RET');
  }
}
