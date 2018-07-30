import ts from 'typescript';
import * as symbol from './symbol';
import * as utils from './utils';

export function getLocalTargetSymbol(typeChecker: ts.TypeChecker, node: ts.ExportSpecifier): ts.Symbol | undefined {
  return utils.getValueOrUndefined(typeChecker.getExportSpecifierLocalTargetSymbol(node));
}

export function getLocalTargetDeclarations(
  typeChecker: ts.TypeChecker,
  node: ts.ExportSpecifier,
): ReadonlyArray<ts.Declaration> {
  const localSymbol = getLocalTargetSymbol(typeChecker, node);
  if (localSymbol === undefined) {
    return [];
  }

  return symbol.getDeclarations(localSymbol);
}
