import ts from 'typescript';

export function getLiteralValue(node: ts.StringLiteral | ts.LiteralExpression): string;
export function getLiteralValue(node: ts.NumericLiteral): number;
export function getLiteralValue(node: ts.StringLiteral | ts.NumericLiteral | ts.LiteralExpression): string | number {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return parseInt(node.text, 10);
  }

  if (ts.isLiteralExpression(node)) {
    return node.text;
  }

  throw new Error('Never');
}
