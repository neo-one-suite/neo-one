import ts from 'typescript';
import { getText } from './node';

export function getLiteralValue(node: ts.NumericLiteral): number;
export function getLiteralValue(
  node:
    | ts.StringLiteral
    | ts.LiteralExpression
    | ts.TemplateHead
    | ts.TemplateMiddle
    | ts.TemplateTail
    | ts.PrivateIdentifier,
): string;
export function getLiteralValue(
  node:
    | ts.StringLiteral
    | ts.NumericLiteral
    | ts.LiteralExpression
    | ts.TemplateHead
    | ts.TemplateMiddle
    | ts.TemplateTail
    | ts.PrivateIdentifier,
): string | number {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return parseInt(node.text, 10);
  }

  if (ts.isLiteralExpression(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
    return node.text;
  }

  if (ts.isPrivateIdentifier(node)) {
    return getText(node);
  }

  throw new Error('Never');
}
