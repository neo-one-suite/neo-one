import { Node, ts } from 'ts-simple-ast';

// tslint:disable-next-line export-name
export const isPublic = (node: Node): boolean =>
  // tslint:disable-next-line no-bitwise
  (node.getCombinedModifierFlags() & ts.ModifierFlags.Public) !== 0;
