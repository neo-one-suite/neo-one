import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ArrayLiteralExpressionCompiler extends NodeCompiler<ts.ArrayLiteralExpression> {
  public readonly kind = ts.SyntaxKind.ArrayLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ts.ArrayLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const elements = _.reverse([...tsUtils.expression.getElements(node)]);
    elements.forEach((element) => {
      sb.visit(element, options);
    });
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
