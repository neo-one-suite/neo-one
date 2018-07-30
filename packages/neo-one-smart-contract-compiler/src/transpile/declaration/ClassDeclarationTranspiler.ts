import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeTranspiler } from '../NodeTranspiler';
import { Transpiler } from '../transpiler';

const DEPLOY_METHOD = 'deploy';

const createAccessors = (transpiler: Transpiler, property: ts.Declaration): ReadonlyArray<ts.ClassElement> => {
  const name = tsUtils.node.getNameOrThrow(property);
  const type = tsUtils.type_.getType(transpiler.typeChecker, property);
  const originalTypeNode = tsUtils.type_.typeToTypeNodeOrThrow(transpiler.typeChecker, type, property);
  const typeNode = transpiler.getFinalTypeNode(property, type, originalTypeNode);
  let getAccess = ts.ModifierFlags.Private;
  if (tsUtils.modifier.isPublic(property)) {
    getAccess = ts.ModifierFlags.Public;
  } else if (tsUtils.modifier.isProtected(property)) {
    getAccess = ts.ModifierFlags.Protected;
  }

  let createGet = false;
  let setAccess = getAccess;
  if (tsUtils.modifier.isReadonly(property)) {
    createGet = true;
    getAccess = ts.ModifierFlags.Protected;
    setAccess = ts.ModifierFlags.Protected;
  }

  return [
    createGet
      ? tsUtils.setOriginalRecursive(
          ts.createMethod(
            undefined,
            ts.createModifiersFromModifierFlags(ts.ModifierFlags.Public),
            undefined,
            `get${name[0].toUpperCase()}${name.slice(1)}`,
            undefined,
            undefined,
            [],
            typeNode,
            ts.createBlock([ts.createReturn(ts.createPropertyAccess(ts.createThis(), name))]),
          ),
          property,
        )
      : undefined,
    tsUtils.setOriginalRecursive(
      ts.createGetAccessor(
        undefined,
        ts.createModifiersFromModifierFlags(getAccess),
        name,
        [],
        typeNode,
        ts.createBlock([
          ts.createReturn(
            ts.createAsExpression(
              ts.createCall(ts.createIdentifier('syscall'), undefined, [
                ts.createStringLiteral('Neo.Storage.Get'),
                ts.createCall(ts.createIdentifier('syscall'), undefined, [
                  ts.createStringLiteral('Neo.Storage.GetContext'),
                ]),
                ts.createStringLiteral(name),
              ]),
              typeNode,
            ),
          ),
        ]),
      ),
      property,
    ),
    tsUtils.setOriginalRecursive(
      ts.createSetAccessor(
        undefined,
        ts.createModifiersFromModifierFlags(setAccess),
        name,
        [ts.createParameter(undefined, undefined, undefined, name, undefined, typeNode, undefined)],
        ts.createBlock([
          ts.createExpressionStatement(
            ts.createCall(ts.createIdentifier('syscall'), undefined, [
              ts.createStringLiteral('Neo.Storage.Put'),
              ts.createCall(ts.createIdentifier('syscall'), undefined, [
                ts.createStringLiteral('Neo.Storage.GetContext'),
              ]),
              ts.createStringLiteral(name),
              ts.createIdentifier(name),
            ]),
          ),
        ]),
      ),
      property,
    ),
  ].filter(utils.notNull);
};

export class ClassDeclarationTranspiler extends NodeTranspiler<ts.ClassDeclaration> {
  public readonly kind = ts.SyntaxKind.ClassDeclaration;

  public visitNode(transpiler: Transpiler, node: ts.ClassDeclaration): ts.ClassDeclaration {
    if (transpiler.isSmartContract(node)) {
      return this.transpileDeploy(transpiler, node);
    }

    return node;
  }

  private transpileDeploy(transpiler: Transpiler, node: ts.ClassDeclaration): ts.ClassDeclaration {
    const existingDeploy = tsUtils.class_.getInstanceMethod(node, DEPLOY_METHOD);
    if (existingDeploy !== undefined) {
      transpiler.reportError(
        existingDeploy,
        'The deploy method is reserved in SmartContract instances.',
        DiagnosticCode.UNSUPPORTED_SYNTAX,
      );

      return node;
    }

    const ctor = tsUtils.class_.getConcreteConstructor(node);
    let bodyStatements: ReadonlyArray<ts.Statement> = [];
    let parameters: ReadonlyArray<ts.ParameterDeclaration> = [];
    if (ctor === undefined) {
      const baseCtor = this.getBaseConstructor(transpiler, node);
      if (baseCtor !== undefined) {
        parameters = tsUtils.parametered
          .getParameters(baseCtor)
          .map((param, idx) =>
            tsUtils.setOriginal(
              ts.createParameter(
                undefined,
                undefined,
                param.dotDotDotToken,
                tsUtils.setOriginal(ts.createIdentifier(`p${idx}`), param),
                param.questionToken,
                param.type,
                param.initializer,
              ),
              param,
            ),
          );
        bodyStatements = [
          tsUtils.setOriginalRecursive(
            ts.createExpressionStatement(
              ts.createCall(
                ts.createPropertyAccess(ts.createSuper(), DEPLOY_METHOD),
                undefined,
                parameters
                  .map((param) => tsUtils.node.getNameNode(param))
                  .filter(ts.isIdentifier)
                  .map((param) => tsUtils.markOriginal(param)),
              ),
            ),
            node,
          ),
        ];
      }
    } else {
      let superDeployStatements: ReadonlyArray<ts.Statement> = [];
      let firstStatement = tsUtils.statement.getStatements(ctor)[0] as ts.Statement | undefined;
      if (firstStatement !== undefined && ts.isExpressionStatement(firstStatement)) {
        const callExpr = tsUtils.expression.getExpression(firstStatement);
        if (ts.isCallExpression(callExpr)) {
          const lhsrExpr = tsUtils.expression.getExpression(callExpr);
          if (tsUtils.guards.isSuperExpression(lhsrExpr)) {
            superDeployStatements = [
              tsUtils.setOriginalRecursive(
                ts.createExpressionStatement(
                  ts.createCall(
                    ts.createPropertyAccess(ts.createSuper(), DEPLOY_METHOD),
                    undefined,
                    tsUtils.argumented.getArguments(callExpr).map((arg) => tsUtils.markOriginal(arg)),
                  ),
                ),
                firstStatement,
              ),
            ];
            firstStatement = undefined;
          }
        }
      }

      bodyStatements = superDeployStatements.concat(firstStatement === undefined ? [] : [firstStatement]).concat(
        tsUtils.statement
          .getStatements(ctor)
          .slice(1)
          .map((statement) => tsUtils.markOriginal(statement)),
      );
      parameters = tsUtils.parametered.getParameters(ctor).map((param) => tsUtils.markOriginal(param));
    }

    const mutableBodyStatements = [...bodyStatements];

    const originalInstanceProperties = tsUtils.class_.getInstanceProperties(node);
    const instanceProperties: ReadonlyArray<ts.ClassElement> = _.flatMap(
      originalInstanceProperties.map((property) => {
        if (ts.isPropertyDeclaration(property) && !tsUtils.modifier.isAbstract(property)) {
          const name = tsUtils.node.getName(property);
          const type = tsUtils.type_.getType(transpiler.typeChecker, property);

          if (transpiler.isOnlyLib(property, type, 'MapStorage')) {
            return tsUtils.setOriginal(
              ts.createProperty(
                property.decorators,
                property.modifiers,
                property.name,
                property.questionToken === undefined ? property.exclamationToken : property.questionToken,
                property.type,
                tsUtils.setOriginalRecursive(
                  ts.createNew(ts.createIdentifier('MapStorage'), undefined, [
                    ts.createCall(ts.createIdentifier('syscall'), undefined, [
                      ts.createStringLiteral('Neo.Runtime.Serialize'),
                      ts.createStringLiteral(name),
                    ]),
                  ]),
                  property,
                ),
              ),
              property,
            );
          }

          if (transpiler.isOnlyLib(property, type, 'SetStorage')) {
            return tsUtils.setOriginal(
              ts.createProperty(
                property.decorators,
                property.modifiers,
                property.name,
                property.questionToken === undefined ? property.exclamationToken : property.questionToken,
                property.type,
                tsUtils.setOriginalRecursive(
                  ts.createNew(ts.createIdentifier('SetStorage'), undefined, [
                    ts.createCall(ts.createIdentifier('syscall'), undefined, [
                      ts.createStringLiteral('Neo.Runtime.Serialize'),
                      ts.createStringLiteral(name),
                    ]),
                  ]),
                  property,
                ),
              ),
              property,
            );
          }

          const init = tsUtils.initializer.getInitializer(property);
          let addAccessors = true;
          if (init !== undefined) {
            if (tsUtils.modifier.isReadonly(property)) {
              addAccessors = false;
            } else {
              mutableBodyStatements.push(
                tsUtils.setOriginalRecursive(
                  ts.createExpressionStatement(
                    ts.createBinary(
                      ts.createPropertyAccess(ts.createThis(), name),
                      ts.SyntaxKind.EqualsToken,
                      tsUtils.markOriginal(init),
                    ),
                  ),
                  property,
                ),
              );
            }
          }

          if (addAccessors) {
            return createAccessors(transpiler, property);
          }
        }

        if (tsUtils.guards.isParameterDeclaration(property)) {
          const name = tsUtils.markOriginal(tsUtils.node.getNameNodeOrThrow(property));

          mutableBodyStatements.push(
            tsUtils.setOriginal(
              ts.createExpressionStatement(
                ts.createBinary(ts.createPropertyAccess(ts.createThis(), name), ts.SyntaxKind.EqualsToken, name),
              ),
              property,
            ),
          );

          return createAccessors(transpiler, property);
        }

        return property;
      }),
    );

    const deployMethod = tsUtils.setOriginalRecursive(
      ts.createMethod(
        undefined,
        [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
        undefined,
        DEPLOY_METHOD,
        undefined,
        undefined,
        parameters,
        ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
        ts.createBlock(mutableBodyStatements.concat([ts.createReturn(ts.createTrue())])),
      ),
      ctor === undefined ? node : ctor,
    );

    const originalInstancePropertiesSet: Set<ts.ClassElement | ts.ParameterPropertyDeclaration> = new Set(
      originalInstanceProperties,
    );

    return tsUtils.setOriginal(
      ts.createClassDeclaration(
        node.decorators,
        node.modifiers,
        node.name,
        node.typeParameters,
        node.heritageClauses,
        instanceProperties.concat(
          node.members
            .filter((member) => member !== ctor && !originalInstancePropertiesSet.has(member))
            .concat([deployMethod]),
        ),
      ),
      node,
    );
  }

  private getBaseConstructor(transpiler: Transpiler, node: ts.ClassDeclaration): ts.ConstructorDeclaration | undefined {
    const baseClass = tsUtils.class_.getBaseClass(transpiler.typeChecker, node);
    if (baseClass === undefined) {
      return undefined;
    }

    const ctor = tsUtils.class_.getConcreteConstructor(baseClass);
    if (ctor === undefined) {
      return this.getBaseConstructor(transpiler, baseClass);
    }

    return ctor;
  }
}
