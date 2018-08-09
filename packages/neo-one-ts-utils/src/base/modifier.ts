// tslint:disable no-bitwise
import ts from 'typescript';
import * as utils from '../utils';

export function getModifiers(node: ts.Node): ReadonlyArray<ts.Modifier> {
  const modifiers = utils.getValueOrUndefined(node.modifiers);

  return modifiers === undefined ? [] : modifiers;
}

// tslint:disable-next-line:no-any
export function getFirstModifierByKind<Token extends ts.Modifier>(
  node: ts.Node,
  kind: Token extends ts.Token<infer TKind> ? TKind : never,
): Token | undefined {
  return getModifiers(node).find((modifier): modifier is Token => modifier.kind === kind);
}

export function getAbstractKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.AbstractKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.AbstractKeyword);
}

export function isAbstract(node: ts.Node): boolean {
  return getAbstractKeyword(node) !== undefined;
}

export function getConstKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.ConstKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.ConstKeyword);
}

export function isConst(node: ts.Node): boolean {
  return getConstKeyword(node) !== undefined;
}

export function getPublicKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.PublicKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.PublicKeyword);
}

export function isPublic(node: ts.Node): boolean {
  return getPublicKeyword(node) !== undefined;
}

export function getProtectedKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.ProtectedKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.ProtectedKeyword);
}

export function isProtected(node: ts.Node): boolean {
  return getProtectedKeyword(node) !== undefined;
}

export function getPrivateKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.PrivateKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.PrivateKeyword);
}

export function isPrivate(node: ts.Node): boolean {
  return getPrivateKeyword(node) !== undefined;
}

export function getReadonlyKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.ReadonlyKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.ReadonlyKeyword);
}

export function isReadonly(node: ts.Node): boolean {
  return getReadonlyKeyword(node) !== undefined;
}

export function getStaticKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.StaticKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.StaticKeyword);
}

export function isStatic(node: ts.Node): boolean {
  return getStaticKeyword(node) !== undefined;
}

export function getExportKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.ExportKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.ExportKeyword);
}

export function hasExportKeyword(node: ts.Node): boolean {
  return getExportKeyword(node) !== undefined;
}

export function getDefaultKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.DefaultKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.DefaultKeyword);
}

export function hasDefaultKeyword(node: ts.Node): boolean {
  return getDefaultKeyword(node) !== undefined;
}

export function isNamedExport(node: ts.Node): boolean {
  const parent = utils.getValueOrUndefined(node.parent);

  return parent !== undefined && ts.isSourceFile(parent) && hasExportKeyword(node) && !hasDefaultKeyword(node);
}

export function isDefaultExport(node: ts.Node): boolean {
  return hasExportKeyword(node) && hasDefaultKeyword(node);
}

export function getDeclareKeyword(node: ts.Node): ts.Token<ts.SyntaxKind.DeclareKeyword> | undefined {
  return getFirstModifierByKind(node, ts.SyntaxKind.DeclareKeyword);
}

export function hasDeclareKeyword(node: ts.Node): boolean {
  return getDeclareKeyword(node) !== undefined;
}
