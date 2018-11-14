import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

export const isConstructorParameterDefault = (node: ts.Node) => {
  const parent = tsUtils.node.getParent(node) as ts.Node | undefined;

  if (parent === undefined || !ts.isParameter(parent)) {
    return false;
  }

  const parentParent = tsUtils.node.getParent(parent);

  return ts.isConstructorDeclaration(parentParent);
};
