import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ArrayLiteralExpressionCompiler extends NodeCompiler<ts.ArrayLiteralExpression> {
  public readonly kind = ts.SyntaxKind.ArrayLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ts.ArrayLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [arr]
    sb.emitHelper(node, options, sb.helpers.args);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapArray);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
