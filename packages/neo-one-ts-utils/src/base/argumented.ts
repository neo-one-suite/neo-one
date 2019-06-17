import ts from 'typescript';
import * as utils from '../utils';

export type ArgumentedNode = ts.Node & { readonly arguments: ts.NodeArray<ts.Expression> };

export function getArguments(node: ArgumentedNode): readonly ts.Expression[] {
  return node.arguments;
}

export type MaybeArgumentedNode = ts.Node & { readonly arguments?: ts.NodeArray<ts.Expression> };

export function getArgumentsArray(node: MaybeArgumentedNode): readonly ts.Expression[] {
  return utils.getArray(node.arguments);
}

export type MaybeTypeArgumentedNode = ts.Node & { readonly typeArguments?: ts.NodeArray<ts.TypeNode> };

export function getTypeArguments(node: MaybeTypeArgumentedNode): readonly ts.TypeNode[] | undefined {
  return utils.getValueOrUndefined(node.typeArguments);
}

export function getTypeArgumentsArray(node: MaybeTypeArgumentedNode): readonly ts.TypeNode[] {
  return utils.getArray(getTypeArguments(node));
}
