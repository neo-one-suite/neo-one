import {
  ClassDeclaration,
  MethodDeclaration,
  ParameterDeclaration,
  Scope,
  Statement,
  SyntaxKind,
  TypeGuards,
} from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import * as typeUtils from '../../typeUtils';
import { NodeTranspiler } from '../NodeTranspiler';
import { Transpiler } from '../transpiler';
import { VisitOptions } from '../types';

const DEPLOY_METHOD = 'deploy';

export class ClassDeclarationTranspiler extends NodeTranspiler<ClassDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.ClassDeclaration;

  public visitNode(transpiler: Transpiler, node: ClassDeclaration, options: VisitOptions): void {
    if (options.isSmartContract || transpiler.isSmartContract(node)) {
      this.transpileSmartContract(transpiler, node, transpiler.isSmartContractOptions(options));
    }
  }

  private transpileSmartContract(transpiler: Transpiler, node: ClassDeclaration, options: VisitOptions): void {
    const baseClass = node.getBaseClass();
    if (baseClass !== undefined) {
      transpiler.visit(baseClass, options);
    }

    this.transpileDeploy(transpiler, node);
  }

  private transpileDeploy(transpiler: Transpiler, node: ClassDeclaration): void {
    const existingDeploy = node.getMethod(DEPLOY_METHOD);
    if (existingDeploy !== undefined) {
      transpiler.reportError(
        existingDeploy,
        'The deploy method is reserved in SmartContract instances.',
        DiagnosticCode.UNSUPPORTED_SYNTAX,
      );

      return;
    }

    const ctor = node.getConstructors().find((ctorDecl) => ctorDecl.isImplementation());
    let bodyText = '';
    let parameters: ParameterDeclaration[] = [];
    if (ctor === undefined) {
      const baseDeploy = this.getBaseDeploy(transpiler, node);
      if (baseDeploy !== undefined) {
        bodyText = `
          super.deploy(${baseDeploy
            .getParameters()
            .map((param) => param.getName())
            .join(', ')});
        `;
        parameters = baseDeploy.getParameters();
      }
    } else {
      const firstStatement = ctor.getStatements()[0] as Statement | undefined;
      if (firstStatement !== undefined && TypeGuards.isExpressionStatement(firstStatement)) {
        const callExpr = firstStatement.getExpression();
        if (TypeGuards.isCallExpression(callExpr)) {
          const lhsrExpr = callExpr.getExpression();
          if (TypeGuards.isSuperExpression(lhsrExpr)) {
            firstStatement.replaceWithText(
              `super.deploy(${callExpr
                .getArguments()
                .map((arg) => arg.getText())
                .join(', ')});`,
            );
          }
        }
      }

      bodyText = ctor
        .getStatements()
        .map((statement) => statement.getText())
        .join('\n');
      parameters = ctor.getParameters();
    }

    const deployParameters = parameters.map((param) => {
      const initializer = param.getInitializer();
      let type = param.getType().getText();
      const typeNode = param.getTypeNode();
      if (typeNode !== undefined) {
        type = typeNode.getText();
      }

      return {
        name: param.getNameOrThrow(),
        type,
        initializer: initializer === undefined ? undefined : initializer.getText(),
        hasQuestionToken: param.hasQuestionToken(),
        isRestParameter: param.isRestParameter(),
      };
    });

    node.getInstanceProperties().forEach((property) => {
      if (
        (TypeGuards.isPropertyDeclaration(property) && !property.isAbstract()) ||
        TypeGuards.isParameterDeclaration(property)
      ) {
        const name = TypeGuards.isPropertyDeclaration(property) ? property.getName() : property.getNameOrThrow();
        const type = property.getType();
        const typeNode = property.getTypeNode();

        if (typeNode === undefined) {
          transpiler.reportError(property, 'Could not determine type of property.', DiagnosticCode.UNKNOWN_TYPE);
        } else if (
          typeUtils.isOnlyPrimitive(type) ||
          transpiler.isFixedType(property, type) ||
          transpiler.isOnlyGlobal(property, type, 'Buffer')
        ) {
          if (TypeGuards.isParameterDeclaration(property)) {
            bodyText += `this.${property.getName()} = ${property.getName()};`;
          }

          const init = property.getInitializer();
          let addAccessors = true;
          if (TypeGuards.isPropertyDeclaration(property) && init !== undefined) {
            if (property.isReadonly()) {
              addAccessors = false;
            } else {
              bodyText += `this.${property.getName()} = ${init.getText()};`;
            }
          }

          if (addAccessors) {
            node.addGetAccessor({
              name,
              returnType: typeNode.getText(),
              bodyText: `
              return syscall('Neo.Storage.Get', syscall('Neo.Storage.GetContext'), '${name}') as ${typeNode.getText()};
              `,
              scope: property.getScope(),
            });
            node.addSetAccessor({
              name,
              parameters: [
                {
                  name,
                  type: typeNode.getText(),
                },
              ],
              bodyText: `
              syscall('Neo.Storage.Put', syscall('Neo.Storage.GetContext'), '${name}', ${name});
              `,
              scope: property.getScope(),
            });
            property.remove();
          }
        } else if (transpiler.isOnlyLib(property, type, 'MapStorage')) {
          property.setInitializer(`new MapStorage(syscall('Neo.Runtime.Serialize', '${name}'))`);
        } else if (transpiler.isOnlyLib(property, type, 'SetStorage')) {
          property.setInitializer(`new SetStorage(syscall('Neo.Runtime.Serialize', '${name}'))`);
        } else {
          transpiler.reportError(property, 'Unsupported SmartContract property.', DiagnosticCode.UNSUPPORTED_SYNTAX);
        }
      }
    });

    node.addMethod({
      name: DEPLOY_METHOD,
      returnType: 'boolean',
      bodyText: `${bodyText}return true;`,
      parameters: deployParameters,
      scope: Scope.Public,
    });

    if (ctor !== undefined) {
      ctor.remove();
    }
  }

  private getBaseDeploy(transpiler: Transpiler, node: ClassDeclaration): MethodDeclaration | undefined {
    const baseClass = node.getBaseClass();
    if (baseClass === undefined) {
      return undefined;
    }

    const deploy = baseClass.getInstanceMethod(DEPLOY_METHOD);
    if (deploy === undefined) {
      return this.getBaseDeploy(transpiler, baseClass);
    }

    return deploy;
  }
}
