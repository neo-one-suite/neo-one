import { PropertyNamedNode, tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { InternalObjectProperty } from '../constants';
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

    const impl = tsUtils.class_.getImplementsArray(decl);
    const implementsBuiltIn = impl.find((implType) => {
      const implSymbol = sb.getSymbol(tsUtils.expression.getExpression(implType));
      if (implSymbol === undefined) {
        /* istanbul ignore next */
        return false;
      }

      const builtin = sb.builtIns.get(implSymbol);

      return builtin !== undefined && !builtin.canImplement;
    });

    if (implementsBuiltIn !== undefined) {
      sb.reportError(decl, DiagnosticCode.InvalidBuiltinImplement, DiagnosticMessage.CannotImplementBuiltin);

      return;
    }

    const switchProperty = (
      node: PropertyNamedNode,
      innerOptions: VisitOptions,
      handleString: (options: VisitOptions) => void,
      handleSymbol: (options: VisitOptions) => void,
    ): void => {
      const nameNode = tsUtils.node.getNameNode(node);
      if (ts.isComputedPropertyName(nameNode)) {
        const expr = tsUtils.expression.getExpression(nameNode);
        const throwTypeError = (innerInnerOptions: VisitOptions) => {
          // []
          /* istanbul ignore next */
          sb.emitOp(node, 'DROP');
          // []
          /* istanbul ignore next */
          sb.emitHelper(node, innerInnerOptions, sb.helpers.throwTypeError);
        };

        const processString = (innerInnerOptions: VisitOptions) => {
          // [string]
          sb.emitHelper(node, innerInnerOptions, sb.helpers.getString);
          // []
          handleString(innerInnerOptions);
        };

        const processSymbol = (innerInnerOptions: VisitOptions) => {
          // [string, val]
          sb.emitHelper(node, innerInnerOptions, sb.helpers.getSymbol);
          // [val, string, val]
          handleSymbol(innerInnerOptions);
        };

        sb.visit(expr, sb.pushValueOptions(innerOptions));

        sb.emitHelper(
          expr,
          innerOptions,
          sb.helpers.forBuiltInType({
            type: sb.getType(expr),
            array: throwTypeError,
            boolean: throwTypeError,
            buffer: throwTypeError,
            null: throwTypeError,
            number: throwTypeError,
            object: throwTypeError,
            string: processString,
            symbol: processSymbol,
            undefined: throwTypeError,
          }),
        );
      } else {
        // [string, val]
        sb.emitPushString(node, tsUtils.node.getName(node));
        // [val, string, val]
        handleString(innerOptions);
      }
    };

    const addProperty = (property: ts.PropertyDeclaration, innerOptions: VisitOptions) => {
      const initializer = tsUtils.initializer.getInitializer(property);
      if (initializer !== undefined) {
        // [thisObjectVal, thisObjectVal]
        sb.emitOp(initializer, 'DUP');

        // [thisObjectVal]
        switchProperty(
          property,
          innerOptions,
          (innerInnerOptions) => {
            sb.visit(initializer, sb.pushValueOptions(innerInnerOptions));
            sb.emitHelper(initializer, innerOptions, sb.helpers.setDataPropertyObjectProperty);
          },
          (innerInnerOptions) => {
            sb.visit(initializer, sb.pushValueOptions(innerInnerOptions));
            sb.emitHelper(initializer, innerOptions, sb.helpers.setDataSymbolObjectProperty);
          },
        );
      }
    };

    // Create constructor function
    // [farr]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createConstructArray({
        withScope: true,
        body: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // [argsarr]
          const ctorImpl = tsUtils.class_.getConcreteConstructor(decl);
          const ctorNode = ctorImpl === undefined ? decl : ctorImpl;
          // Default value assignments
          if (ctorImpl !== undefined) {
            // []
            sb.emitHelper(ctorImpl, innerOptions, sb.helpers.parameters);
            // Super call statement
          } else if (superClass !== undefined && extendsExpr !== undefined) {
            // [thisObjectVal, argsarr]
            sb.scope.getThis(sb, extendsExpr, innerOptions);
            // [ctor, thisObjectVal, argsarr]
            sb.scope.get(sb, extendsExpr, innerOptions, superClass);
            // []
            sb.emitHelper(extendsExpr, sb.noPushValueOptions(innerOptions), sb.helpers.invokeConstruct());
            // Drop the argsarray, we must not use it
          } else {
            // []
            sb.emitOp(decl, 'DROP');
          }
          // Parameter property assignments
          // Member variable assignments
          // [thisObjectVal]
          sb.scope.getThis(sb, ctorNode, innerOptions);
          tsUtils.class_
            .getConcreteInstanceProperties(decl)
            .filter(ts.isPropertyDeclaration)
            .forEach((property) => {
              addProperty(property, innerOptions);
            });
          // []
          sb.emitOp(ctorNode, 'DROP');
          // Constructor statements
          if (ctorImpl !== undefined) {
            sb.visit(tsUtils.body.getBodyOrThrow(ctorImpl), sb.noPushValueOptions(innerOptions));
          }
        },
      }),
    );

    // [fobjectVal]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createFunctionObject({
        property: InternalObjectProperty.Construct,
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

    const addMethod = (method: ts.MethodDeclaration) => {
      const visit = (innerOptions: VisitOptions) => {
        // [farr]
        sb.emitHelper(method, innerOptions, sb.helpers.createCallArray);
        // [methodObjectVal]
        sb.emitHelper(
          method,
          innerOptions,
          sb.helpers.createFunctionObject({
            property: InternalObjectProperty.Call,
          }),
        );
      };
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(method, 'DUP');
      // [name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]

      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      switchProperty(
        method,
        options,
        (innerOptions) => {
          visit(innerOptions);
          sb.emitHelper(method, innerOptions, sb.helpers.setDataPropertyObjectProperty);
        },
        (innerOptions) => {
          visit(innerOptions);
          sb.emitHelper(method, innerOptions, sb.helpers.setDataSymbolObjectProperty);
        },
      );
    };

    tsUtils.class_.getConcreteInstanceMethods(decl).forEach((method) => {
      addMethod(method);
    });

    tsUtils.class_.getConcreteMembers(decl).forEach((member) => {
      const decorators = tsUtils.decoratable.getDecorators(member);
      if (decorators !== undefined && decorators.length > 0) {
        sb.reportUnsupported(decorators[0]);
      }
    });

    const addSetAccessor = (accessor: ts.SetAccessorDeclaration) => {
      const visit = (innerOptions: VisitOptions) => {
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, innerOptions, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          innerOptions,
          sb.helpers.createFunctionObject({
            property: InternalObjectProperty.Call,
          }),
        );
        const getAccessor = tsUtils.accessor.getGetAccessor(accessor);
        const hasGet = getAccessor !== undefined;
        if (getAccessor !== undefined) {
          sb.emitHelper(getAccessor, innerOptions, sb.helpers.createCallArray);
          sb.emitHelper(
            getAccessor,
            innerOptions,
            sb.helpers.createFunctionObject({
              property: InternalObjectProperty.Call,
            }),
          );
        }

        return hasGet;
      };
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(accessor, 'DUP');
      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      switchProperty(
        accessor,
        options,
        (innerOptions) => {
          const hasGet = visit(innerOptions);
          sb.emitHelper(
            accessor,
            options,
            sb.helpers.setAccessorPropertyObjectProperty({
              hasSet: true,
              hasGet,
            }),
          );
        },
        (innerOptions) => {
          const hasGet = visit(innerOptions);
          sb.emitHelper(
            accessor,
            options,
            sb.helpers.setAccessorSymbolObjectProperty({
              hasSet: true,
              hasGet,
            }),
          );
        },
      );
    };

    tsUtils.class_
      .getConcreteInstanceMembers(decl)
      .filter(ts.isSetAccessor)
      .forEach((accessor) => {
        addSetAccessor(accessor);
      });

    const addGetAccessor = (accessor: ts.GetAccessorDeclaration) => {
      const visit = (innerOptions: VisitOptions) => {
        // [farr, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(accessor, innerOptions, sb.helpers.createCallArray);
        // [methodObjectVal, name, objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
        sb.emitHelper(
          accessor,
          innerOptions,
          sb.helpers.createFunctionObject({
            property: InternalObjectProperty.Call,
          }),
        );
      };
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(accessor, 'DUP');
      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      switchProperty(
        accessor,
        options,
        (innerOptions) => {
          visit(innerOptions);
          // [objectVal, 'prototype', fobjectVal, fobjectVal]
          sb.emitHelper(
            accessor,
            options,
            sb.helpers.setAccessorPropertyObjectProperty({
              hasSet: false,
              hasGet: true,
            }),
          );
        },
        (innerOptions) => {
          visit(innerOptions);
          // [objectVal, 'prototype', fobjectVal, fobjectVal]
          sb.emitHelper(
            accessor,
            options,
            sb.helpers.setAccessorSymbolObjectProperty({
              hasSet: false,
              hasGet: true,
            }),
          );
        },
      );
    };

    tsUtils.class_
      .getConcreteInstanceMembers(decl)
      .filter(ts.isGetAccessor)
      .filter((accessor) => tsUtils.accessor.getSetAccessor(accessor) === undefined)
      .forEach((accessor) => {
        addGetAccessor(accessor);
      });

    // Set superclass prototype
    if (superClass !== undefined && extendsExpr !== undefined) {
      // [objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitOp(extendsExpr, 'DUP');
      // ['__proto__', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitPushString(extendsExpr, '__proto__');
      // [superobjectVal, '__proto__', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.scope.get(sb, extendsExpr, options, superClass);
      // ['prototype', superobjectVal, '__proto__', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitPushString(extendsExpr, 'prototype');
      // [superprototype, 'prototype', objectVal, objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(extendsExpr, options, sb.helpers.getPropertyObjectProperty);
      // [objectVal, 'prototype', fobjectVal, fobjectVal]
      sb.emitHelper(extendsExpr, options, sb.helpers.setDataPropertyObjectProperty);
    }

    // [fobjectVal]
    sb.emitHelper(decl, options, sb.helpers.setDataPropertyObjectProperty);

    tsUtils.class_
      .getConcreteStaticProperties(decl)
      .filter(ts.isPropertyDeclaration)
      .forEach((property) => {
        addProperty(property, options);
      });
    tsUtils.class_.getConcreteStaticMethods(decl).forEach((method) => {
      addMethod(method);
    });
    tsUtils.class_
      .getConcreteStaticMembers(decl)
      .filter(ts.isSetAccessor)
      .forEach((accessor) => {
        addSetAccessor(accessor);
      });
    tsUtils.class_
      .getConcreteStaticMembers(decl)
      .filter(ts.isGetAccessor)
      .filter((accessor) => tsUtils.accessor.getSetAccessor(accessor) === undefined)
      .forEach((accessor) => {
        addGetAccessor(accessor);
      });

    // Set superclass prototype
    if (superClass !== undefined && extendsExpr !== undefined) {
      // [fobjectVal, fobjectVal]
      sb.emitOp(extendsExpr, 'DUP');
      // ['__proto__', fobjectVal, fobjectVal]
      sb.emitPushString(extendsExpr, '__proto__');
      // [superobjectVal, '__proto__', fobjectVal, fobjectVal]
      sb.scope.get(sb, extendsExpr, options, superClass);
      // [fobjectVal]
      sb.emitHelper(extendsExpr, options, sb.helpers.setDataPropertyObjectProperty);
    }

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
