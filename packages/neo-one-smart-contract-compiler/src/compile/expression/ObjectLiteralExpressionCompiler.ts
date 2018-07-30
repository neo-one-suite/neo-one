import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ObjectLiteralExpressionCompiler extends NodeCompiler<ts.ObjectLiteralExpression> {
  public readonly kind = ts.SyntaxKind.ObjectLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ts.ObjectLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    tsUtils.object_.getProperties(node).forEach((prop) => {
      // [objectVal, objectVal]
      sb.emitOp(node, 'DUP');
      if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop) || ts.isMethodDeclaration(prop)) {
        // [propString, objectVal, objectVal]
        sb.emitPushString(prop, tsUtils.node.getName(prop));
        if (ts.isPropertyAssignment(prop)) {
          // [val, propString, objectVal, objectVal]
          sb.visit(tsUtils.initializer.getInitializerOrThrow(prop), options);
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          // [val, propString, objectVal, objectVal]
          sb.visit(tsUtils.node.getNameNode(prop), options);
        } else if (ts.isMethodDeclaration(prop)) {
          // [callArr, propString, objectVal, objectVal]
          sb.emitHelper(prop, options, sb.helpers.createCallArray);
          // [callObj, propString, objectVal, objectVal]
          sb.emitHelper(
            prop,
            options,
            sb.helpers.createFunctionObject({
              property: InternalFunctionProperties.Call,
            }),
          );
        } else {
          sb.reportUnsupported(prop);
        }
        // [objectVal]
        sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
      } else {
        sb.reportUnsupported(prop);
      }
    });

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
