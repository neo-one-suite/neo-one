import ts from 'typescript';

import * as utils from './utils';

type ExpressionedNode = ts.Node & { readonly expression: ts.Expression };
type MaybeExpressionedNode = ts.Node & { readonly expression?: ts.Expression };

export function getExpression(expression: ExpressionedNode): ts.Expression;
export function getExpression(expression: MaybeExpressionedNode): ts.Expression | undefined;
export function getExpression(expression: ExpressionedNode | MaybeExpressionedNode): ts.Expression | undefined {
  return utils.getValueOrUndefined(expression.expression);
}

export function getExpressionForCall(node: ts.CallLikeExpression): ts.Expression {
  if (ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isDecorator(node)) {
    return getExpression(node);
  }

  if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
    return node.tagName;
  }

  return node.tag;
}

export function getElements(expression: ts.ArrayLiteralExpression): ReadonlyArray<ts.Expression> {
  const elements = utils.getValueOrUndefined(expression.elements);

  return elements === undefined ? [] : elements;
}

export function getLeft(expression: ts.BinaryExpression): ts.Expression {
  return expression.left;
}

export function getOperatorToken(expression: ts.BinaryExpression): ts.BinaryOperatorToken {
  return expression.operatorToken;
}

export function getRight(expression: ts.BinaryExpression): ts.Expression {
  return expression.right;
}

export function getArguments(expression: ts.CallExpression): ReadonlyArray<ts.Expression> {
  return expression.arguments;
}

export function getArgumentExpression(expression: ts.ElementAccessExpression): ts.Expression | undefined {
  return utils.getValueOrUndefined(expression.argumentExpression);
}

export function getArgumentExpressionOrThrow(expression: ts.ElementAccessExpression): ts.Expression {
  return utils.throwIfNullOrUndefined(getArgumentExpression(expression), 'argument');
}

export function getCondition(expression: ts.ConditionalExpression): ts.Expression {
  return expression.condition;
}

export function getWhenTrue(expression: ts.ConditionalExpression): ts.Expression {
  return expression.whenTrue;
}

export function getWhenFalse(expression: ts.ConditionalExpression): ts.Expression {
  return expression.whenFalse;
}

export function getOperand(expression: ts.PostfixUnaryExpression): ts.LeftHandSideExpression;
export function getOperand(expression: ts.PrefixUnaryExpression): ts.UnaryExpression;
export function getOperand(
  expression: ts.PostfixUnaryExpression | ts.PrefixUnaryExpression,
): ts.LeftHandSideExpression | ts.UnaryExpression {
  return expression.operand;
}

export function getOperator(expression: ts.PostfixUnaryExpression): ts.PostfixUnaryOperator;
export function getOperator(expression: ts.PrefixUnaryExpression): ts.PrefixUnaryOperator;
export function getOperator(
  expression: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression,
): ts.PrefixUnaryOperator | ts.PostfixUnaryOperator {
  return expression.operator;
}
