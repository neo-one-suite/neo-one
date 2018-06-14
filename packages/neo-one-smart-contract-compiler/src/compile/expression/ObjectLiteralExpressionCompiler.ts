import { ObjectLiteralExpression, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ObjectLiteralExpressionCompiler extends NodeCompiler<ObjectLiteralExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.ObjectLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ObjectLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    node.getProperties().forEach((prop) => {
      // [objectVal, objectVal]
      sb.emitOp(node, 'DUP');
      if (
        TypeGuards.isPropertyAssignment(prop) ||
        TypeGuards.isShorthandPropertyAssignment(prop) ||
        TypeGuards.isMethodDeclaration(prop)
      ) {
        // [propString, objectVal, objectVal]
        sb.emitPushString(prop, prop.getName());
        if (TypeGuards.isPropertyAssignment(prop)) {
          // [val, propString, objectVal, objectVal]
          sb.visit(prop.getInitializerOrThrow(), options);
        } else if (TypeGuards.isShorthandPropertyAssignment(prop)) {
          // [val, propString, objectVal, objectVal]
          sb.visit(prop.getNameNode(), options);
        } else if (TypeGuards.isMethodDeclaration(prop)) {
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
