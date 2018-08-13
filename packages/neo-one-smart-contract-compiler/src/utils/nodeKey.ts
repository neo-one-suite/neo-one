import ts from 'typescript';

const getID = (node: ts.Node) => {
  // tslint:disable-next-line no-any
  const nodeAny: any = node;

  return nodeAny.id == undefined
    ? `${node.getSourceFile().fileName}:${node.getStart()}:${node.getWidth()}`
    : nodeAny.id;
};
export const nodeKey = (node: ts.Node) => `${getID(node)}`;
