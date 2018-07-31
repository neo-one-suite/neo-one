import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ClassDeclarationCompiler extends NodeCompiler<ts.ClassDeclaration> {
  public readonly kind = ts.SyntaxKind.ClassDeclaration;

  public visitNode(sb: ScriptBuilder, decl: ts.ClassDeclaration, optionsIn: VisitOptions): void {
    let options = sb.pushValueOptions(sb.noSuperClassOptions(optionsIn));
    const name = sb.scope.add(tsUtils.node.getNameOrThrow(decl));
    const extendsExpr = tsUtils.class_.getExtends(decl);
    let superClassIn;
    if (extendsExpr !== undefined) {
      superClassIn = sb.scope.addUnique();
      options = sb.superClassOptions(options, superClassIn);
      // [superClass]
      sb.visit(tsUtils.expression.getExpression(extendsExpr), options);
      // []
      sb.scope.set(sb, extendsExpr, options, superClassIn);
    }
    const superClass = superClassIn;

    // Create constructor function
    // [farr]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createConstructArray({
        body: () => {
          // [argsarr]
          const ctorImpl = tsUtils.class_.getConcreteConstructor(decl);
          const ctorNode = ctorImpl === undefined ? decl : ctorImpl;
          // Default value assignments
          if (ctorImpl !== undefined) {
            // []
            sb.emitHelper(ctorImpl, options, sb.helpers.parameters);
            // Super call statement
          } else if (superClass !== undefined && extendsExpr !== undefined) {
            // [thisObjectVal, argsarr]
            sb.scope.getThis(sb, extendsExpr, options);
            // [ctor, thisObjectVal, argsarr]
            sb.scope.get(sb, extendsExpr, options, superClass);
            // []
            sb.emitHelper(extendsExpr, options, sb.helpers.invokeConstruct());
            // Drop the argsarray, we must not use it
          } else {
            // []
            sb.emitOp(decl, 'DROP');
          }
          // Parameter property assignments
          // Member variable assignments
          // [thisObjectVal]
          sb.scope.getThis(sb, ctorNode, options);
          tsUtils.class_
            .getConcreteInstanceProperties(decl)
            .filter(ts.isPropertyDeclaration)
            .forEach((property) => {
              const initializer = tsUtils.initializer.getInitializer(property);
              if (initializer !== undefined) {
                sb.emitOp(initializer, 'DUP');
                // [prop, thisObjectVal, thisObjectVal]
                sb.emitPushString(initializer, tsUtils.node.getName(property));
                // [init, prop, thisObjectVal, thisObjectVal]
                sb.visit(initializer, options);
                // [thisObjectVal]
                sb.emitHelper(initializer, options, sb.helpers.setDataPropertyObjectProperty);
              }
            });
          // []
          sb.emitOp(ctorNode, 'DROP');
          // Constructor statements
          if (ctorImpl !== undefined) {
            sb.visit(tsUtils.body.getBodyOrThrow(ctorImpl), options);
          }
        },
      }),
    );

    // [fobjectVal]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.Construct,
      }),
    );

    // Create prototype
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
    tsUtils.class_.getConcreteInstanceMethods(decl).forEach((method) => {
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(method, 'DUP');
      // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitPushString(method, tsUtils.node.getName(method));
      // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(method, options, sb.helpers.createCallArray);
      // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(
        method,
        options,
        sb.helpers.createFunctionObject({
          property: InternalFunctionProperties.Call,
        }),
      );
      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(method, options, sb.helpers.setDataPropertyObjectProperty);
    });

    tsUtils.class_.getConcreteMembers(decl).forEach((member) => {
      const decorators = tsUtils.decoratable.getDecorators(member);
      if (decorators !== undefined && decorators.length > 0) {
        sb.reportUnsupported(decorators[0]);
      }
    });

    tsUtils.class_
      .getConcreteInstanceMembers(decl)
      .filter(ts.isSetAccessor)
      .forEach((accessor) => {
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(accessor, 'DUP');
        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(accessor, tsUtils.node.getName(accessor));
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, options, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.Call,
          }),
        );
        const getAccessor = tsUtils.accessor.getGetAccessor(accessor);
        const hasGet = getAccessor !== undefined;
        if (getAccessor !== undefined) {
          sb.emitHelper(getAccessor, options, sb.helpers.createCallArray);
          sb.emitHelper(
            getAccessor,
            options,
            sb.helpers.createFunctionObject({
              property: InternalFunctionProperties.Call,
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

    tsUtils.class_
      .getConcreteInstanceMembers(decl)
      .filter(ts.isGetAccessor)
      .filter((accessor) => tsUtils.accessor.getSetAccessor(accessor) === undefined)
      .forEach((accessor) => {
        // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitOp(accessor, 'DUP');
        // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitPushString(accessor, tsUtils.node.getName(accessor));
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, options, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          options,
          sb.helpers.createFunctionObject({
            property: InternalFunctionProperties.Call,
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

    // Set superclass prototype
    if (superClass !== undefined && extendsExpr !== undefined) {
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
      sb.emitHelper(extendsExpr, options, sb.helpers.setDataPropertyObjectProperty);
    }

    // [fobjectVal]
    sb.emitHelper(decl, options, sb.helpers.setDataPropertyObjectProperty);

    if (tsUtils.modifier.isNamedExport(decl) || tsUtils.modifier.isDefaultExport(decl)) {
      // [fobjectVal, fobjectVal]
      sb.emitOp(decl, 'DUP');
      // [fobjectVal]
      sb.emitHelper(
        decl,
        options,
        sb.helpers.exportSingle({
          name: tsUtils.modifier.isNamedExport(decl) ? tsUtils.node.getNameOrThrow(decl) : undefined,
          defaultExport: tsUtils.modifier.isDefaultExport(decl),
        }),
      );
    }
    // []
    sb.scope.set(sb, decl, options, name);
  }
}
