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

export function getValueDeclarationOrThrow(node: ts.Symbol): ts.Declaration {
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
  const members = utils.getValueOrUndefined(node.members);

  return members === undefined ? utils.getValueOrUndefined(node.exports) : members;
}

export function getMembersOrThrow(node: ts.Symbol): ts.SymbolTable {
  return utils.throwIfNullOrUndefined(getMembers(node), 'members');
}

export function getMember(node: ts.Symbol, name: string): ts.Symbol | undefined {
  const members = getMembers(node);

  return members === undefined ? undefined : members.get(name as ts.__String);
}

export function getMemberOrThrow(node: ts.Symbol, name: string): ts.Symbol {
  return utils.throwIfNullOrUndefined(getMember(node, name), 'symbol member');
}

export function isArgumentsSymbol(typeChecker: ts.TypeChecker, node: ts.Symbol): boolean {
  return typeChecker.isArgumentsSymbol(node);
}

export function getTarget(symbol: ts.Symbol): ts.Symbol {
  // tslint:disable-next-line no-any
  const symbolAny: any = symbol;

  return symbolAny.target === undefined ? symbol : symbolAny.target;
}
