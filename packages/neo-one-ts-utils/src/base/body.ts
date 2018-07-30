import ts from 'typescript';
import * as utils from '../utils';

export type BodiedNode = ts.Node & { readonly body: ts.Node };
export type BodyableNode = ts.Node & { readonly body?: ts.Node };

export function getBody(node: BodiedNode): ts.Node;
export function getBody(node: BodyableNode): ts.Node | undefined;
export function getBody(node: BodiedNode | BodyableNode): ts.Node | undefined {
  return utils.getValueOrUndefined(node.body);
}

export function getBodyOrThrow(node: BodiedNode | BodyableNode): ts.Node {
  return utils.throwIfNullOrUndefined(getBody(node), 'body');
}

export function hasBody<TNode extends BodyableNode>(node: TNode): node is TNode & BodiedNode {
  return getBody(node) !== undefined;
}
