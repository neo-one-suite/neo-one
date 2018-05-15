import { ArrayLiteralExpression, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export default class ArrayLiteralExpressionCompiler extends NodeCompiler<
  ArrayLiteralExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.ArrayLiteralExpression;

  public visitNode(
    sb: ScriptBuilder,
    node: ArrayLiteralExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);

    const elements = [...node.getElements()].reverse();
    for (const element of elements) {
      sb.visit(element, options);
    }
    // [length, ...vals]
    sb.emitPushInt(node, elements.length);
    // [valArr]
    sb.emitOp(node, 'PACK');
    // [arrayObjectVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
