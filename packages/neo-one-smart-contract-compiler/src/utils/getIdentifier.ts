import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

export function getIdentifier(node: ts.Node | undefined): ts.Identifier | undefined {
  return node === undefined ? node : tsUtils.node.getFirstDescendantByKind(node, ts.SyntaxKind.Identifier);
}
