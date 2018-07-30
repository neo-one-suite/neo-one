import ts from 'typescript';

// tslint:disable-next-line export-name
export function getProperties(node: ts.ObjectLiteralExpression): ReadonlyArray<ts.ObjectLiteralElementLike> {
  return node.properties;
}
