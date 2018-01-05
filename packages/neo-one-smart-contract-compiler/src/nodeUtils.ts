import { Node, ts } from 'ts-simple-ast';

export const isPublic = (node: Node): boolean =>
  // tslint:disable-next-line no-bitwise
  (node.getCombinedModifierFlags() & ts.ModifierFlags.Public) !== 0;
