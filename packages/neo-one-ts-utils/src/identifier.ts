import ts from 'typescript';

// tslint:disable-next-line export-name
export function isUndefined(identifier: ts.Identifier): boolean {
  return identifier.originalKeywordKind === ts.SyntaxKind.UndefinedKeyword;
}
