import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { isBuiltInConstruct } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NewExpressionCompiler extends NodeCompiler<ts.NewExpression> {
  public readonly kind = ts.SyntaxKind.NewExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const newExpr = tsUtils.expression.getExpression(expr);
    const newSymbol = sb.getSymbol(newExpr);

    if (newSymbol !== undefined) {
      const builtin = sb.builtIns.get(newSymbol);
      if (builtin !== undefined && isBuiltInConstruct(builtin)) {
        builtin.emitConstruct(sb, expr, optionsIn);

        return;
      }
    }

    // [argsarr]
    sb.emitHelper<ts.Node>(expr, options, sb.helpers.args);
    // [objectVal, argsarr]
    sb.visit(newExpr, options);
    // [thisVal]
    sb.emitHelper(expr, optionsIn, sb.helpers.new());
  }
}
