import ts from 'typescript';
import * as utils from '../utils';
import { getSyntaxKindName } from './syntaxKind';

type HeritageClausableNode = ts.Node & { readonly heritageClauses?: ts.NodeArray<ts.HeritageClause> };

export function getHeritageClauses(node: HeritageClausableNode): ReadonlyArray<ts.HeritageClause> {
  const heritageClauses = utils.getValueOrUndefined(node.heritageClauses);
  if (heritageClauses === undefined) {
    return [];
  }

  return heritageClauses;
}

export function getHeritageClauseByKind(
  node: HeritageClausableNode,
  kind: ts.SyntaxKind.ExtendsKeyword | ts.SyntaxKind.ImplementsKeyword,
): ts.HeritageClause | undefined {
  return getHeritageClauses(node).find((clause) => clause.token === kind);
}

export function getHeritageClauseByKindOrThrow(
  node: HeritageClausableNode,
  kind: ts.SyntaxKind.ExtendsKeyword | ts.SyntaxKind.ImplementsKeyword,
): ts.HeritageClause {
  return utils.throwIfNullOrUndefined(
    getHeritageClauseByKind(node, kind),
    `heritage clause of kind ${getSyntaxKindName(kind)}`,
  );
}

export function getTypeNodes(node: ts.HeritageClause): ReadonlyArray<ts.ExpressionWithTypeArguments> {
  const types = utils.getValueOrUndefined(node.types);

  return types === undefined ? [] : types;
}

export function getToken(node: ts.HeritageClause): ts.SyntaxKind.ExtendsKeyword | ts.SyntaxKind.ImplementsKeyword {
  return node.token;
}

export function isExtends(node: ts.HeritageClause): boolean {
  return getToken(node) === ts.SyntaxKind.ExtendsKeyword;
}

export function isImplements(node: ts.HeritageClause): boolean {
  return getToken(node) === ts.SyntaxKind.ImplementsKeyword;
}
