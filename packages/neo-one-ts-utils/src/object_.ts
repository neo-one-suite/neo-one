import ts from 'typescript';

// tslint:disable-next-line export-name
export function getProperties(node: ts.ObjectLiteralExpression): readonly ts.ObjectLiteralElementLike[] {
  return node.properties;
}
