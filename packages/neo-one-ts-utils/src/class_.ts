import _ from 'lodash';
import ts from 'typescript';
import { heritage, modifier, overload, parametered } from './base';
import * as declaration from './declaration';
import * as node_ from './node';
import * as reference from './reference';
import * as symbol_ from './symbol';
import * as type_ from './type_';
import * as utils from './utils';

export type ClassPropertyType = ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration;
export function isClassProperty(node: ts.Node): node is ClassPropertyType {
  return ts.isPropertyDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node);
}

export type ClassInstancePropertyType = ClassPropertyType | ts.ParameterPropertyDeclaration;
export function isClassInstanceProperty(node: ts.Node): node is ClassInstancePropertyType {
  return (isClassProperty(node) || ts.isParameterPropertyDeclaration(node, node.parent)) && !modifier.isStatic(node);
}

export type ClassInstanceMemberType = ts.MethodDeclaration | ClassInstancePropertyType;
export function isClassInstanceMember(node: ts.Node): node is ClassInstanceMemberType {
  return (ts.isMethodDeclaration(node) || isClassInstanceProperty(node)) && !modifier.isStatic(node);
}

export type ClassStaticPropertyType = ClassPropertyType;
export function isClassStaticProperty(node: ts.Node): node is ClassStaticPropertyType {
  return (ts.isMethodDeclaration(node) || isClassProperty(node)) && modifier.isStatic(node);
}

export type ClassStaticMemberType = ts.MethodDeclaration | ClassStaticPropertyType;
export function isClassStaticMember(node: ts.Node): node is ClassStaticMemberType {
  return (ts.isMethodDeclaration(node) || isClassProperty(node)) && modifier.isStatic(node);
}

export type ClassMemberType = ClassInstanceMemberType | ClassStaticMemberType;
export function isClassMember(node: ts.Node): node is ClassMemberType {
  return isClassInstanceMember(node) || isClassStaticMember(node);
}

export function getExtends(node: ts.ClassDeclaration | ts.ClassExpression): ts.ExpressionWithTypeArguments | undefined {
  const extendsClause = heritage.getHeritageClauseByKind(node, ts.SyntaxKind.ExtendsKeyword);
  if (extendsClause === undefined) {
    return undefined;
  }

  const typeNodes = heritage.getTypeNodes(extendsClause);

  return typeNodes.length === 0 ? undefined : typeNodes[0];
}

export function getExtendsOrThrow(node: ts.ClassDeclaration | ts.ClassExpression): ts.ExpressionWithTypeArguments {
  return utils.throwIfNullOrUndefined(getExtends(node), 'extends expression');
}

export function getImplements(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ts.ExpressionWithTypeArguments[] | undefined {
  const implementsClause = heritage.getHeritageClauseByKind(node, ts.SyntaxKind.ImplementsKeyword);
  if (implementsClause === undefined) {
    return undefined;
  }

  return heritage.getTypeNodes(implementsClause);
}

export function getImplementsArray(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ts.ExpressionWithTypeArguments[] {
  return utils.getArray(getImplements(node));
}

export function getMembers(node: ts.ClassDeclaration | ts.ClassExpression): readonly ClassMemberType[] {
  // tslint:disable-next-line readonly-array
  const members: Array<ts.ClassElement | ts.ParameterPropertyDeclaration> = [...node.members];
  const implementationCtors = members.filter(ts.isConstructorDeclaration).filter((c) => overload.isImplementation(c));
  // tslint:disable-next-line no-loop-statement
  for (const ctor of implementationCtors) {
    // insert after the constructor
    let insertIndex = members.indexOf(ctor) + 1;
    // tslint:disable-next-line no-loop-statement
    for (const param of parametered.getParameters(ctor)) {
      if (ts.isParameterPropertyDeclaration(param, param.parent)) {
        // tslint:disable-next-line no-array-mutation
        members.splice(insertIndex, 0, param);
        insertIndex += 1;
      }
    }
  }

  return members.filter(isClassMember);
}

export function getConcreteMembers(node: ts.ClassDeclaration | ts.ClassExpression): readonly ClassMemberType[] {
  return declaration.isAmbient(node)
    ? []
    : getMembers(node).filter((member) => {
        if (ts.isMethodDeclaration(member)) {
          return overload.isImplementation(member);
        }

        return true;
      });
}

export function getInstanceProperties(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassInstancePropertyType[] {
  return getMembers(node).filter(isClassInstanceProperty);
}

export function getInstanceMembers(node: ts.ClassDeclaration | ts.ClassExpression): readonly ClassInstanceMemberType[] {
  return getMembers(node).filter(isClassInstanceMember);
}

export function getInstanceMethods(node: ts.ClassDeclaration | ts.ClassExpression): readonly ts.MethodDeclaration[] {
  return getInstanceMembers(node).filter(ts.isMethodDeclaration);
}

export function getMethods(node: ts.ClassDeclaration | ts.ClassExpression): readonly ts.MethodDeclaration[] {
  return getMembers(node).filter(ts.isMethodDeclaration);
}

export function getSetAccessors(node: ts.ClassDeclaration | ts.ClassExpression): readonly ts.SetAccessorDeclaration[] {
  return getMembers(node).filter(ts.isSetAccessor);
}

export function getInstanceMethod(
  node: ts.ClassDeclaration | ts.ClassExpression,
  name: string,
): ts.MethodDeclaration | undefined {
  return getInstanceMethods(node).find((method) => node_.getName(method) === name);
}

export function getConcreteInstanceProperties(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassInstancePropertyType[] {
  return getConcreteMembers(node).filter(isClassInstanceProperty);
}

export function getConcreteInstanceMembers(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassInstanceMemberType[] {
  return getConcreteMembers(node).filter(isClassInstanceMember);
}

export function getConcreteInstanceMethods(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ts.MethodDeclaration[] {
  return getConcreteInstanceMembers(node).filter(ts.isMethodDeclaration);
}

export function getStaticProperties(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassStaticPropertyType[] {
  return getMembers(node).filter(isClassStaticProperty);
}

export function getStaticMembers(node: ts.ClassDeclaration | ts.ClassExpression): readonly ClassStaticMemberType[] {
  return getMembers(node).filter(isClassStaticMember);
}

export function getConcreteStaticProperties(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassStaticPropertyType[] {
  return getConcreteMembers(node).filter(isClassStaticProperty);
}

export function getConcreteStaticMembers(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ClassStaticMemberType[] {
  return getConcreteMembers(node).filter(isClassStaticMember);
}

export function getConcreteStaticMethods(
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ts.MethodDeclaration[] {
  return getConcreteStaticMembers(node).filter(ts.isMethodDeclaration);
}

export function getConstructors(node: ts.ClassDeclaration | ts.ClassExpression): readonly ts.ConstructorDeclaration[] {
  return node.members.filter(ts.isConstructorDeclaration);
}

export function getConcreteConstructor(
  node: ts.ClassDeclaration | ts.ClassExpression,
): ts.ConstructorDeclaration | undefined {
  return getConstructors(node).find((ctor) => overload.isImplementation(ctor));
}

export function getFirstConcreteConstructor(
  typeChecker: ts.TypeChecker,
  node: ts.ClassDeclaration,
): ts.ConstructorDeclaration | undefined {
  const ctor = getConcreteConstructor(node);
  if (ctor !== undefined) {
    return ctor;
  }

  const baseClass = getBaseClass(typeChecker, node);
  if (baseClass === undefined) {
    return undefined;
  }

  return getFirstConcreteConstructor(typeChecker, baseClass);
}

function getDerivedClassesWorker(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.ClassDeclaration,
  seen = new Set<ts.ClassDeclaration>(),
): readonly ts.ClassDeclaration[] {
  if (seen.has(node)) {
    return [];
  }

  return reference
    .findReferencesAsNodes(program, languageService, node)
    .reduce<readonly ts.ClassDeclaration[]>((acc, ref) => {
      const parent = node_.getParent(ref) as ts.Node | undefined;
      if (parent === undefined) {
        return acc;
      }

      const clause = node_.getParent(parent) as ts.Node | undefined;
      if (clause === undefined || !ts.isHeritageClause(clause) || !heritage.isExtends(clause)) {
        return acc;
      }

      const derived = node_.getFirstAncestorByKindOrThrow<ts.ClassDeclaration>(clause, ts.SyntaxKind.ClassDeclaration);

      return acc.concat(getDerivedClassesWorker(program, languageService, derived, seen));
    }, [])
    .concat([node]);
}

export function getDerivedClasses(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.ClassDeclaration,
): readonly ts.ClassDeclaration[] {
  const result = getDerivedClassesWorker(program, languageService, node);

  return result.filter((value) => value !== node);
}

function getImplementorsWorker(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.ClassDeclaration | ts.InterfaceDeclaration,
  seen = new Set<ts.ClassDeclaration | ts.InterfaceDeclaration>(),
): readonly ts.ClassDeclaration[] {
  if (seen.has(node)) {
    return [];
  }

  return reference
    .findReferencesAsNodes(program, languageService, node)
    .reduce<readonly ts.ClassDeclaration[]>((acc, ref) => {
      const parent = node_.getParent(ref) as ts.Node | undefined;
      if (parent === undefined) {
        return acc;
      }

      const clause = node_.getParent(parent) as ts.Node | undefined;
      if (
        (clause === undefined || !ts.isHeritageClause(clause) || !heritage.isExtends(clause)) &&
        !(clause && ts.isExpressionWithTypeArguments(clause))
      ) {
        return acc;
      }

      let derived: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined =
        node_.getFirstAncestorByKind<
          ts.ClassDeclaration
        >(clause, ts.SyntaxKind.ClassDeclaration);
      if (derived === undefined) {
        derived = node_.getFirstAncestorByKindOrThrow<ts.InterfaceDeclaration>(
          clause,
          ts.SyntaxKind.InterfaceDeclaration,
        );
      }

      return acc.concat(getImplementorsWorker(program, languageService, derived, seen));
    }, [])
    .concat(ts.isClassDeclaration(node) ? [node] : []);
}

export function getImplementors(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.InterfaceDeclaration,
): readonly ts.ClassDeclaration[] {
  return getImplementorsWorker(program, languageService, node);
}

function getExtendorsWorker(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.ClassDeclaration,
  seen = new Set<ts.ClassDeclaration>(),
): readonly ts.ClassDeclaration[] {
  if (seen.has(node)) {
    return [];
  }

  return reference
    .findReferencesAsNodes(program, languageService, node)
    .reduce<readonly ts.ClassDeclaration[]>((acc, ref) => {
      const parent = node_.getParent(ref) as ts.Node | undefined;
      if (parent === undefined) {
        return acc;
      }

      const clause = node_.getParent(parent) as ts.Node | undefined;
      if (clause === undefined || !ts.isHeritageClause(clause) || !heritage.isExtends(clause)) {
        return acc;
      }

      const derived: ts.ClassDeclaration | undefined = node_.getFirstAncestorByTestOrThrow(
        clause,
        ts.isClassDeclaration,
      );

      return acc.concat(getImplementorsWorker(program, languageService, derived, seen));
    }, [])
    .concat(ts.isClassDeclaration(node) ? [node] : []);
}

export function getExtendors(
  program: ts.Program,
  languageService: ts.LanguageService,
  node: ts.ClassDeclaration,
): readonly ts.ClassDeclaration[] {
  return getExtendorsWorker(program, languageService, node);
}

export function getBaseTypes(
  typeChecker: ts.TypeChecker,
  node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration,
): readonly ts.Type[] {
  return type_.getBaseTypesArray(type_.getType(typeChecker, node));
}

export function getBaseTypesFlattened(
  typeChecker: ts.TypeChecker,
  node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration,
): readonly ts.Type[] {
  function getBaseTypesWorker(type: ts.Type): readonly ts.Type[] {
    if (type_.isIntersection(type)) {
      return _.flatten(type_.getIntersectionTypesArray(type).map(getBaseTypesWorker));
    }

    const baseTypes = type_.getBaseTypesArray(type);

    return [type].concat(_.flatten(baseTypes.map(getBaseTypesWorker)));
  }

  return _.flatten(getBaseTypes(typeChecker, node).map(getBaseTypesWorker));
}

export function getBaseClasses(
  typeChecker: ts.TypeChecker,
  node: ts.ClassDeclaration | ts.ClassExpression,
): readonly ts.ClassDeclaration[] {
  const baseTypes = getBaseTypesFlattened(typeChecker, node);

  return baseTypes
    .map((type) => type_.getSymbol(type))
    .filter(utils.notNull)
    .map((symbol) => symbol_.getDeclarations(symbol))
    .reduce<readonly ts.Declaration[]>((a, b) => a.concat(b), [])
    .filter(ts.isClassDeclaration);
}

export function getBaseClass(
  typeChecker: ts.TypeChecker,
  node: ts.ClassDeclaration | ts.ClassExpression,
): ts.ClassDeclaration | undefined {
  const declarations = getBaseClasses(typeChecker, node);

  return declarations.length === 1 ? declarations[0] : undefined;
}
