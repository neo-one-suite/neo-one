import ts from 'typescript';
import * as utils from './utils';

export function getName(node: ts.Symbol): string {
  return node.name;
}

export function getDeclarations(node: ts.Symbol): ReadonlyArray<ts.Declaration> {
  const declarations = utils.getValueOrUndefined(node.declarations);

  return declarations === undefined ? [] : declarations;
}

export function getValueDeclaration(node: ts.Symbol): ts.Declaration | undefined {
  return utils.getValueOrUndefined(node.valueDeclaration);
}

export function getValueDeclarationOrThrow(node: ts.Symbol): ts.Declaration | undefined {
  return utils.throwIfNullOrUndefined(getValueDeclaration(node), 'value declaration');
}

export function getAliasedSymbol(typeChecker: ts.TypeChecker, node: ts.Symbol): ts.Symbol | undefined {
  try {
    return utils.getValueOrUndefined(typeChecker.getAliasedSymbol(node));
  } catch {
    return undefined;
  }
}

export function getMembers(node: ts.Symbol): ts.SymbolTable | undefined {
  return utils.getValueOrUndefined(node.members);
}

export function getMember(node: ts.Symbol, name: string): ts.Symbol | undefined {
  const members = getMembers(node);

  return members === undefined ? undefined : members.get(name as ts.__String);
}

export function getMemberOrThrow(node: ts.Symbol, name: string): ts.Symbol {
  return utils.throwIfNullOrUndefined(getMember(node, name), 'symbol member');
}
