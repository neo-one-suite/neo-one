import * as body from './body';

type OverloadableNode = body.BodyableNode;

export function isImplementation(node: OverloadableNode): boolean {
  return body.getBody(node) !== undefined;
}

export function isOverload(node: OverloadableNode): boolean {
  return !isImplementation(node);
}
