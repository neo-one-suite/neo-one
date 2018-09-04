import ts from 'typescript';
import * as node_ from './node';
import * as symbol from './symbol';
import * as utils from './utils';

export function getAliasNode(node: ts.ImportSpecifier | ts.ExportSpecifier): ts.Identifier | undefined {
  return utils.getValueOrUndefined(node.propertyName);
}

export function getAliasName(node: ts.ImportSpecifier | ts.ExportSpecifier): string | undefined {
  const aliasNode = getAliasNode(node);
  if (aliasNode === undefined) {
    return aliasNode;
  }

  return aliasNode.getText();
}

export function getModuleSpecifier(node: ts.ImportDeclaration | ts.ExportDeclaration): ts.StringLiteral | undefined {
  const moduleSpecifier = utils.getValueOrUndefined(node.moduleSpecifier);
  if (moduleSpecifier === undefined) {
    return undefined;
  }

  if (!ts.isStringLiteral(moduleSpecifier)) {
    throw new Error('Unexpected module specifier.');
  }

  return moduleSpecifier;
}

export function getModuleSpecifierSymbol(
  typeChecker: ts.TypeChecker,
  node: ts.ImportDeclaration | ts.ExportDeclaration,
): ts.Symbol | undefined {
  const moduleSpecifier = getModuleSpecifier(node);
  if (moduleSpecifier === undefined) {
    return undefined;
  }

  return node_.getSymbol(typeChecker, moduleSpecifier);
}

export function getModuleSpecifierSourceFile(
  typeChecker: ts.TypeChecker,
  node: ts.ImportDeclaration | ts.ExportDeclaration,
): ts.SourceFile | undefined {
  const nodeSymbol = getModuleSpecifierSymbol(typeChecker, node);
  if (nodeSymbol === undefined) {
    return undefined;
  }

  const declarations = symbol.getDeclarations(nodeSymbol).filter(ts.isSourceFile);

  return declarations.length === 0 ? undefined : declarations[0];
}

export function getModuleSpecifierSourceFileOrThrow(
  typeChecker: ts.TypeChecker,
  node: ts.ImportDeclaration | ts.ExportDeclaration,
): ts.SourceFile {
  return utils.throwIfNullOrUndefined(getModuleSpecifierSourceFile(typeChecker, node), 'source file');
}

export function isExportEquals(node: ts.ExportAssignment): boolean {
  return !!node.isExportEquals;
}
