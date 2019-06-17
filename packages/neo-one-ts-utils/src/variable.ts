import ts from 'typescript';
import * as utils from './utils';

// tslint:disable-next-line export-name
export function getDeclarations(node: ts.VariableDeclarationList): readonly ts.VariableDeclaration[] {
  const declarations = utils.getValueOrUndefined(node.declarations);

  return declarations === undefined ? [] : declarations;
}

export function getDeclarationList(node: ts.VariableStatement): ts.VariableDeclarationList {
  return node.declarationList;
}

export function getDeclarationsFromStatement(node: ts.VariableStatement): readonly ts.VariableDeclaration[] {
  return getDeclarations(getDeclarationList(node));
}
