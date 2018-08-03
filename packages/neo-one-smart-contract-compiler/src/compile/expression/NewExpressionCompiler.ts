import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NewExpressionCompiler extends NodeCompiler<ts.NewExpression> {
  public readonly kind = ts.SyntaxKind.NewExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [argsarr]
    sb.emitHelper<ts.Node>(expr, options, sb.helpers.args);
    // [objectVal, argsarr]
    sb.visit(tsUtils.expression.getExpression(expr), options);
    // [thisVal]
    sb.emitHelper(expr, optionsIn, sb.helpers.new());
  }
}
