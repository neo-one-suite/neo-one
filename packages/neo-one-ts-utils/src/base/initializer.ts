import ts from 'typescript';
import * as utils from '../utils';

export type InitializerExpressionedNode = ts.Node & { readonly initializer: ts.Expression };
export type InitializerExpressionableNode = ts.Node & { readonly initializer?: ts.Expression };

export function getInitializer(node: InitializerExpressionedNode): ts.Expression;
export function getInitializer(node: InitializerExpressionableNode): ts.Expression | undefined;
export function getInitializer(node: InitializerExpressionableNode): ts.Expression | undefined {
  return utils.getValueOrUndefined(node.initializer);
}

export function getInitializerOrThrow(node: InitializerExpressionableNode): ts.Expression {
  return utils.throwIfNullOrUndefined(getInitializer(node), 'initializer');
}

export function hasInitializer(node: InitializerExpressionableNode): boolean {
  return getInitializer(node) !== undefined;
}
