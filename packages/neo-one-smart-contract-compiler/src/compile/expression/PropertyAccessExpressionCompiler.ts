import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class PropertyAccessExpressionCompiler extends NodeCompiler<ts.PropertyAccessExpression> {
  public readonly kind = ts.SyntaxKind.PropertyAccessExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.PropertyAccessExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    const expression = tsUtils.expression.getExpression(expr);
    // [val]
    sb.visit(expression, options);
    // [objectVal]
    sb.emitHelper(expression, options, sb.helpers.toObject({ type: sb.getType(expression) }));

    if (optionsIn.setValue) {
      if (optionsIn.pushValue) {
        // [objectVal, value, objectVal]
        sb.emitOp(expression, 'TUCK');
      }
      // [name, objectVal, value, objectVal]
      sb.emitPushString(expr, tsUtils.node.getName(expr));
      // [value, name, objectVal, objectVal]
      sb.emitOp(expr, 'ROT');
      // [objectVal]
      sb.emitHelper(expr, options, sb.helpers.setPropertyObjectProperty);
    }

    if (optionsIn.pushValue || !optionsIn.setValue) {
      // [name, objectVal]
      sb.emitPushString(expr, tsUtils.node.getName(expr));
      // [value]
      sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);

      if (!optionsIn.pushValue) {
        sb.emitOp(expr, 'DROP');
      }
    }
  }
}
