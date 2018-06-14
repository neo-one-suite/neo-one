import { NewExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class NewExpressionCompiler extends NodeCompiler<NewExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.NewExpression;

  public visitNode(sb: ScriptBuilder, expr: NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [argsarr]
    sb.emitHelper(expr, options, sb.helpers.args);
    // [objectVal, argsarr]
    sb.visit(expr.getExpression(), options);
    // [thisVal]
    sb.emitHelper(expr, options, sb.helpers.new());
  }
}
