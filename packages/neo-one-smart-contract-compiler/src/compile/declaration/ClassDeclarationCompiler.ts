import { ClassDeclaration, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ClassDeclarationCompiler extends NodeCompiler<ClassDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.ClassDeclaration;

  public visitNode(
    sb: ScriptBuilder,
    decl: ClassDeclaration,
    optionsIn: VisitOptions,
  ): void {
    let options = sb.pushValueOptions(sb.noSuperClassOptions(optionsIn));
    const name = sb.scope.add(decl.getNameOrThrow());
    const extendsExpr = decl.getExtends();
    let superClassIn;
    if (extendsExpr != null) {
      superClassIn = sb.scope.addUnique();
      options = sb.superClassOptions(options, superClassIn);
      // [superClass]
      sb.visit(extendsExpr.getExpression(), options);
      // []
      sb.scope.set(sb, extendsExpr, options, superClassIn);
    }
    const superClass = superClassIn;

    /* Create constructor function */
    // [farr]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createConstructArray({
        body: () => {
          // [argsarr]
          const ctorImpl = decl
            .getConstructors()
            .find((ctor) => ctor.isImplementation());
          // Default value assignments
          if (ctorImpl != null) {
            // []
            sb.emitHelper(ctorImpl, options, sb.helpers.parameters);
            // Super call statement
          } else if (superClass != null && extendsExpr != null) {
            // [thisObjectVal, argsarr]
            sb.scope.getThis(sb, decl, options);
            // [ctor, thisObjectVal, argsarr]
            sb.scope.get(sb, decl, options, superClass);
            // []
            sb.emitHelper(decl, options, sb.helpers.invokeConstruct());
            // Drop the argsarray, we must not use it
          } else {
            // []
            sb.emitOp(decl, 'DROP');
          }
          // Parameter property assignments
          // Member variable assignments
          // [thisObjectVal]
          sb.scope.getThis(sb, decl, options);
          decl
            .getInstanceProperties()
            .filter(TypeGuards.isPropertyDeclaration)
            .forEach((property) => {
              const initializer = property.getInitializer();
              if (initializer != null) {
                sb.emitOp(decl, 'DUP');
                // [prop, thisObjectVal, thisObjectVal]
                sb.emitPushString(initializer, property.getName());
                // [init, prop, thisObjectVal, thisObjectVal]
                sb.visit(initializer, options);
                // [thisObjectVal]
                sb.emitHelper(
                  initializer,
                  options,
                  sb.helpers.setDataPropertyObjectProperty,
                );
              }
            });
          // []
          sb.emitOp(decl, 'DROP');
          // Constructor statements
          if (ctorImpl != null) {
            sb.visit(ctorImpl.getBodyOrThrow(), options);
          }
        },
      }),
    );

    // [fobjectVal]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.CONSTRUCT,
      }),
    );

    /* Create prototype */
    // [fobjectVal, fobjectVal]
    sb.emitOp(decl, 'DUP');
    // ['prototype', fobjectVal, fobjectVal]
    sb.emitPushString(decl, 'prototype');
    // [fobjectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitOp(decl, 'OVER');
    // [objectVal, fobjectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitHelper(decl, options, sb.helpers.createObject);
    // [objectVal, fobjectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitOp(decl, 'TUCK');
    // ['constructor', objectVal, fobjectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitPushString(decl, 'constructor');
    // [fobjectVal, 'constructor', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitOp(decl, 'ROT');
    // [objectVal, 'prototype', fobjectVal, fobjectVal]
    sb.emitHelper(decl, options, sb.helpers.setDataPropertyObjectProperty);
    decl.getInstanceMethods().forEach((method) => {
      if (method.isImplementation()) {
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(method, 'DUP');
        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(method, method.getName());
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(method, options, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          decl,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.CALL,
          }),
        );
        // [objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          method,
          options,
          sb.helpers.setDataPropertyObjectProperty,
        );
      }
    });

    decl
      .getSetAccessors()
      .filter((accessor) => !accessor.isStatic())
      .forEach((accessor) => {
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(accessor, 'DUP');
        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(accessor, accessor.getName());
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, options, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          decl,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.CALL,
          }),
        );
        const getAccessor = accessor.getGetAccessor();
        const hasGet = getAccessor != null;
        if (getAccessor != null) {
          sb.emitHelper(getAccessor, options, sb.helpers.createCallArray);
          sb.emitHelper(
            decl,
            options,
            sb.helpers.createFunctionObject({
              property: InternalFunctionProperties.CALL,
            }),
          );
        }
        // [objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          options,
          sb.helpers.setAccessorPropertyObjectProperty({
            hasSet: true,
            hasGet,
          }),
        );
      });

    decl
      .getGetAccessors()
      .filter(
        (accessor) => !accessor.isStatic() && accessor.getSetAccessor() == null,
      )
      .forEach((accessor) => {
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(accessor, 'DUP');
        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(accessor, accessor.getName());
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, options, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          decl,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.CALL,
          }),
        );
        // [objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          options,
          sb.helpers.setAccessorPropertyObjectProperty({
            hasSet: false,
            hasGet: true,
          }),
        );
      });

    /* Set superclass prototype */
    if (superClass != null && extendsExpr != null) {
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(extendsExpr, 'DUP');
      // ['prototype', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitPushString(extendsExpr, 'prototype');
      // [superobjectVal, 'prototype', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.scope.get(sb, extendsExpr, options, superClass);
      // ['prototype', superobjectVal, 'prototype', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitPushString(extendsExpr, 'prototype');
      // [superprototype, 'prototype', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(extendsExpr, options, sb.helpers.getPropertyObjectProperty);
      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(
        extendsExpr,
        options,
        sb.helpers.setDataPropertyObjectProperty,
      );
    }

    // [fobjectVal]
    sb.emitHelper(decl, options, sb.helpers.setDataPropertyObjectProperty);

    if (decl.isNamedExport() || decl.isDefaultExport()) {
      // [fobjectVal, fobjectVal]
      sb.emitOp(decl, 'DUP');
      // [fobjectVal]
      sb.emitHelper(
        decl,
        options,
        sb.helpers.exportSingle({
          name: decl.isNamedExport() ? decl.getNameOrThrow() : undefined,
          defaultExport: decl.isDefaultExport(),
        }),
      );
    }
    // []
    sb.scope.set(sb, decl, options, name);
  }
}
