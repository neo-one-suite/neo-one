import ts from 'typescript';
import * as utils from '../utils';

export type ArgumentedNode = ts.Node & { readonly arguments: ts.NodeArray<ts.Expression> };

export function getArguments(node: ArgumentedNode): ReadonlyArray<ts.Expression> {
  return node.arguments;
}

export type MaybeArgumentedNode = ts.Node & { readonly arguments?: ts.NodeArray<ts.Expression> };

export function getArgumentsArray(node: MaybeArgumentedNode): ReadonlyArray<ts.Expression> {
  return utils.getArray(node.arguments);
}

export type MaybeTypeArgumentedNode = ts.Node & { readonly typeArguments?: ts.NodeArray<ts.TypeNode> };

export function getTypeArguments(node: MaybeTypeArgumentedNode): ReadonlyArray<ts.TypeNode> | undefined {
  return utils.getValueOrUndefined(node.typeArguments);
}
