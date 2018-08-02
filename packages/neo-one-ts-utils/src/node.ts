// tslint:disable no-any
import ts from 'typescript';
import * as utils from './utils';

type NamedNode = ts.Node & { readonly name: ts.Identifier };
type NameableNode = ts.Node & { readonly name?: ts.Identifier };
type PropertyNamedNode = ts.Node & { readonly name: ts.PropertyName };
type PropertyNameableNode = ts.Node & { readonly name?: ts.PropertyName };
type BindingNamedNode = ts.Node & { readonly name: ts.BindingName };
type BindingNameableNode = ts.Node & { readonly name?: ts.BindingName };
export type AnyNameableNode = NameableNode | PropertyNameableNode | BindingNameableNode;

export function getNameNode(node: NamedNode): ts.Identifier;
export function getNameNode(node: PropertyNamedNode): ts.PropertyName;
export function getNameNode(node: BindingNamedNode): ts.BindingName;
export function getNameNode(node: NameableNode): ts.Identifier | undefined;
export function getNameNode(node: PropertyNameableNode): ts.PropertyName | undefined;
export function getNameNode(node: BindingNameableNode): ts.BindingName | undefined;
export function getNameNode(node: AnyNameableNode): ts.Identifier | ts.PropertyName | ts.BindingName | undefined;
export function getNameNode(node: any): ts.Identifier | ts.PropertyName | ts.BindingName | undefined {
  return utils.getValueOrUndefined(node.name);
}

export function getNameNodeOrThrow(node: NameableNode | NamedNode): ts.Identifier;
export function getNameNodeOrThrow(node: PropertyNameableNode | PropertyNamedNode): ts.PropertyName;
export function getNameNodeOrThrow(node: BindingNameableNode | BindingNamedNode): ts.BindingName;
export function getNameNodeOrThrow(node: any): ts.Identifier | ts.PropertyName | ts.BindingName {
  return utils.throwIfNullOrUndefined(getNameNode(node), 'name');
}

export function getName(node: NamedNode | PropertyNamedNode): string;
export function getName(
  node: NameableNode | PropertyNameableNode | BindingNameableNode | BindingNamedNode,
): string | undefined;
// tslint:disable-next-line no-any
export function getName(node: any): string | undefined {
  const name = getNameNode(node) as ts.Identifier | ts.PropertyName | ts.BindingName | undefined;
  if (name === undefined || ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    return undefined;
  }

  return name.getText();
}

export function getNameOrThrow(
  node: NameableNode | NamedNode | PropertyNameableNode | PropertyNamedNode | BindingNameableNode | BindingNamedNode,
): string {
  // tslint:disable-next-line no-any
  return utils.throwIfNullOrUndefined(getName(node as any), 'name');
}

type PropertyNameNameableNode = ts.Node & { readonly propertyName?: ts.PropertyName };

export function getPropertyNameNode(node: PropertyNameNameableNode): ts.PropertyName | undefined {
  return utils.getValueOrUndefined(node.propertyName);
}

type DotDotDotTokenNode = ts.Node & { readonly dotDotDotToken?: ts.DotDotDotToken };

export function getDotDotDotToken(node: DotDotDotTokenNode): ts.DotDotDotToken | undefined {
  return utils.getValueOrUndefined(node.dotDotDotToken);
}

export function getText(node: ts.Node): string {
  return node.getText();
}

export function getParentSyntaxList(node: ts.Node) {
  const parent = utils.getValueOrUndefined(node.parent);
  if (parent === undefined) {
    return undefined;
  }

  const { pos, end } = node;
  // tslint:disable-next-line no-loop-statement
  for (const child of parent.getChildren()) {
    if (child.pos > end || child === node) {
      return undefined;
    }

    if (child.kind === ts.SyntaxKind.SyntaxList && child.pos <= pos && child.end >= end) {
      return child;
    }
  }

  return undefined; // shouldn't happen
}

export function getParent<TNode extends ts.Node>(
  node: TNode,
): TNode extends { readonly parent?: infer TParent | null } ? TParent : never {
  const parent = utils.getValueOrUndefined(node.parent);

  // tslint:disable-next-line no-any
  return parent === undefined ? undefined : (node.parent as any);
}

export function* getAncestors(node: ts.Node): IterableIterator<ts.Node> {
  let parent = getParent(node) as ts.Node | undefined;
  // tslint:disable-next-line no-loop-statement
  while (parent !== undefined) {
    yield parent;
    parent = getParent(parent);
  }
}

export function* getDescendants(node: ts.Node): IterableIterator<ts.Node> {
  let children = getChildren(node);
  // tslint:disable-next-line no-loop-statement
  while (children.length > 0) {
    const mutableNextChildren: ts.Node[] = [];
    // tslint:disable-next-line no-loop-statement
    for (const child of children) {
      yield child;
      mutableNextChildren.push(...getChildren(child));
    }

    children = mutableNextChildren;
  }
}

function getTarget(symbol: ts.Symbol): ts.Symbol {
  const target = (symbol as any).target;

  return target === undefined ? symbol : target;
}

export function getSymbol(typeChecker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
  // tslint:disable-next-line no-any
  const symbol = utils.getValueOrUndefined((node as any).symbol);
  if (symbol !== undefined) {
    return getTarget(symbol);
  }

  const typeCheckerSymbol = utils.getValueOrUndefined(typeChecker.getSymbolAtLocation(node));
  if (typeCheckerSymbol !== undefined) {
    return getTarget(typeCheckerSymbol);
  }

  const nameNode = getNameNode(node);
  if (nameNode !== undefined) {
    return getSymbol(typeChecker, nameNode);
  }

  return undefined;
}

export function getSymbolOrThrow(typeChecker: ts.TypeChecker, node: ts.Node): ts.Symbol {
  return utils.throwIfNullOrUndefined(getSymbol(typeChecker, node), 'symbol');
}

function getChildren(node: ts.Node): ReadonlyArray<ts.Node> {
  return node.getChildren();
}

export function getFirstChild(node: ts.Node): ts.Node | undefined {
  const children = getChildren(node);

  return utils.getValueOrUndefined(children[0]);
}

export function getFirstChildByKind<TNode extends ts.Node>(
  node: ts.Node,
  kind: TNode extends { readonly kind: infer TKind } ? TKind : never,
): TNode | undefined {
  const children = getChildren(node);

  return children.find((value): value is TNode => value.kind === kind);
}

export function getFirstAncestorByKind<TNode extends ts.Node>(
  node: ts.Node,
  kind: TNode extends { readonly kind: infer TKind } ? TKind : never,
): TNode | undefined {
  // tslint:disable-next-line no-loop-statement
  for (const ancestor of getAncestors(node)) {
    if (ancestor.kind === kind) {
      return ancestor as TNode;
    }
  }

  return undefined;
}

export function getFirstAncestorByKindOrThrow<TNode extends ts.Node>(
  node: ts.Node,
  kind: TNode extends { readonly kind: infer TKind } ? TKind : never,
): TNode {
  // tslint:disable-next-line no-any
  return utils.throwIfNullOrUndefined(getFirstAncestorByKind<TNode>(node, kind as any), 'ancestor');
}

export function getFirstDescendantByKind<TNode extends ts.Node>(
  node: ts.Node,
  kind: TNode extends { readonly kind: infer TKind } ? TKind : never,
): TNode | undefined {
  // tslint:disable-next-line no-loop-statement
  for (const ancestor of getDescendants(node)) {
    if (ancestor.kind === kind) {
      return ancestor as TNode;
    }
  }

  return undefined;
}

function hasNodeFlag(node: ts.Node, flag: ts.NodeFlags): boolean {
  // tslint:disable-next-line no-bitwise
  return (node.flags & flag) !== 0;
}

export function isGlobalAugmentation(node: ts.Node): boolean {
  return hasNodeFlag(node, ts.NodeFlags.GlobalAugmentation);
}

export function getSourceFile(node: ts.Node): ts.SourceFile {
  return node.getSourceFile();
}

export function getPos(node: ts.Node): number {
  return node.pos;
}

export function getEnd(node: ts.Node): number {
  return node.end;
}

export function getChildAtPos(node: ts.Node, pos: number): ts.Node | undefined {
  if (pos < getPos(node) || pos >= getEnd(node)) {
    return undefined;
  }

  return getChildren(node).find((child) => pos >= getPos(child) && pos < getEnd(child));
}

export function getDescendantAtPos(nodeIn: ts.Node, pos: number): ts.Node | undefined {
  let node: ts.Node | undefined;
  // tslint:disable-next-line no-loop-statement
  while (true) {
    const nextNode = getChildAtPos(node === undefined ? nodeIn : node, pos);
    if (nextNode === undefined) {
      return node;
    }

    node = nextNode;
  }
}
