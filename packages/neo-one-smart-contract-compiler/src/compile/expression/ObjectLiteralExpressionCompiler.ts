import { ObjectLiteralExpression, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { InternalFunctionProperties } from '../helper';

export default class ObjectLiteralExpressionCompiler extends NodeCompiler<
  ObjectLiteralExpression
> {
  public readonly kind: SyntaxKind = SyntaxKind.ObjectLiteralExpression;

  public visitNode(
    sb: ScriptBuilder,
    node: ObjectLiteralExpression,
    optionsIn: VisitOptions,
  ): void {
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
              property: InternalFunctionProperties.CALL,
            }),
          );
        } else  {
          sb.reportUnsupported(prop);
        }
        // [objectVal]
        sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
      } else if (TypeGuards.isSetAccessorDeclaration(prop)){
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(prop, 'DUP');

        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(prop, prop.getName());

        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(prop, options, sb.helpers.createCallArray);

        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          node,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.CALL,
          }),
        );

        const getAccessor = prop.getGetAccessor(); // <<<< HERE

        const hasGet = getAccessor != null; // <<<<<<<< ????
        if (getAccessor != null) {
          sb.emitHelper(getAccessor, options, sb.helpers.createCallArray);
          sb.emitHelper(
            node,
            options,
            sb.helpers.createFunctionObject({
              property: InternalFunctionProperties.CALL,
            }),
          );
        }

        // [objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          prop,
          options,
          sb.helpers.setAccessorPropertyObjectProperty({
            hasSet: true,
            hasGet,
          }),
        );

      } else if (TypeGuards.isGetAccessorDeclaration(prop)) {

        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(prop, 'DUP');

        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(prop, prop.getName());

        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(prop, options, sb.helpers.createCallArray);

        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          node, // Changed DECL (class declaration?) to NODE which represents this current object?
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.CALL,
          }),
        );

        // [objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          prop,
          options,
          sb.helpers.setAccessorPropertyObjectProperty({
            hasSet: false,
            hasGet: true,
          }),
        );
      } else {

        sb.reportUnsupported(prop);
      }
    });

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
