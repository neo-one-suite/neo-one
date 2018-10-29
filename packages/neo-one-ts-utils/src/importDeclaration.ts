import ts from 'typescript';
import * as node_ from './node';
import * as utils from './utils';

export function getImportClause(node: ts.ImportDeclaration): ts.ImportClause | undefined {
  return utils.getValueOrUndefined(node.importClause);
}

export function getNamespaceImport(node: ts.ImportDeclaration): ts.NamespaceImport | undefined {
  const clause = getImportClause(node);
  if (clause === undefined) {
    return undefined;
  }

  return node_.getFirstDescendantByKind(node, ts.SyntaxKind.NamespaceImport);
}

export function getNamespaceImportIdentifier(node: ts.ImportDeclaration): ts.Identifier | undefined {
  return getNamespaceImport(node) === undefined
    ? undefined
    : node_.getFirstDescendantByKind(node, ts.SyntaxKind.Identifier);
}

export function getDefaultImport(node: ts.ImportDeclaration): ts.Identifier | undefined {
  const clause = getImportClause(node);
  if (clause === undefined) {
    return undefined;
  }

  const namespaceImport = node_.getFirstDescendantByKind(node, ts.SyntaxKind.NamespaceImport);
  if (namespaceImport !== undefined) {
    return undefined;
  }

  return clause.name;
}

// tslint:disable-next-line export-name
export function getNamedImports(node: ts.ImportDeclaration): ReadonlyArray<ts.ImportSpecifier> {
  const clause = getImportClause(node);
  if (clause === undefined) {
    return [];
  }

  const namedImports =
    clause.namedBindings === undefined || !ts.isNamedImports(clause.namedBindings) ? undefined : clause.namedBindings;
  if (namedImports === undefined) {
    return [];
  }

  const imps = utils.getValueOrUndefined(namedImports.elements);

  return imps === undefined ? [] : imps;
}
