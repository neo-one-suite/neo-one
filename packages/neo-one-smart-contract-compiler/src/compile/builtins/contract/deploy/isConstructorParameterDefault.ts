import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DEPLOY_METHOD } from '../../../../constants';

export const isConstructorParameterDefault = (node: ts.Node) => {
  const parent = tsUtils.node.getParent(node) as ts.Node | undefined;

  if (parent === undefined || !ts.isParameter(parent)) {
    return false;
  }

  const parentParent = tsUtils.node.getParent(parent);
  if (!ts.isMethodDeclaration(parentParent)) {
    // To support getSemanticDiagnostics
    return ts.isConstructorDeclaration(parentParent);
  }

  const name = tsUtils.node.getName(parentParent);

  return name === DEPLOY_METHOD;
};
