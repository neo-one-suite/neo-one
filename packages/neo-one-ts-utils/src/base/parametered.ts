import ts from 'typescript';
import * as node_ from '../node';
import * as utils from '../utils';

export type ParameteredNode = ts.Node & { readonly parameters: ts.NodeArray<ts.ParameterDeclaration> };

// tslint:disable-next-line export-name
export function getParameters(node: ParameteredNode): ts.NodeArray<ts.ParameterDeclaration> {
  return node.parameters;
}

export function getParameter(node: ParameteredNode, name: string): ts.ParameterDeclaration | undefined {
  return getParameters(node).find((value) => node_.getName(value) === name);
}

export function getParameterOrThrow(node: ParameteredNode, name: string): ts.ParameterDeclaration {
  return utils.throwIfNullOrUndefined(getParameter(node, name), 'parameter');
}
