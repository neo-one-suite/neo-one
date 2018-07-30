// tslint:disable no-bitwise
import ts from 'typescript';
import * as guards from './guards';
import * as node_ from './node';
import * as utils from './utils';

export function isAmbientNode(node: ts.Declaration): boolean {
  const ambient = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Ambient) === ts.ModifierFlags.Ambient;

  return ambient || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
}

export function isAmbient(node: ts.Declaration): boolean {
  if (isAmbientNode(node) || node.getSourceFile().isDeclarationFile) {
    return true;
  }

  // tslint:disable-next-line no-loop-statement
  for (const ancestor of node_.getAncestors(node)) {
    if (guards.isDeclaration(ancestor) && isAmbientNode(ancestor)) {
      return true;
    }
  }

  return false;
}

export function getReturnTypeNode(node: ts.MethodDeclaration | ts.GetAccessorDeclaration): ts.TypeNode | undefined {
  return utils.getValueOrUndefined(node.type);
}
