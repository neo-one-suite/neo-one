import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { isBuiltinConstruct } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NewExpressionCompiler extends NodeCompiler<ts.NewExpression> {
  public readonly kind = ts.SyntaxKind.NewExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const newExpr = tsUtils.expression.getExpression(expr);
    const builtin = sb.builtins.getValue(sb.context, newExpr);
    if (builtin !== undefined && isBuiltinConstruct(builtin)) {
      builtin.emitConstruct(sb, expr, optionsIn);

      return;
    }

    // [argsarr]
    sb.emitHelper<ts.Node>(expr, options, sb.helpers.args);
    // [objectVal, argsarr]
    sb.visit(newExpr, options);
    // [thisVal]
    sb.emitHelper(expr, optionsIn, sb.helpers.new());
  }
}
