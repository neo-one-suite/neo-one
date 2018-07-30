import ts from 'typescript';
import { initializer } from './base';
import * as utils from './utils';

export function getQuestionToken(node: ts.ParameterDeclaration): ts.Token<ts.SyntaxKind.QuestionToken> | undefined {
  return utils.getValueOrUndefined(node.questionToken);
}

export function getDotDotDotToken(node: ts.ParameterDeclaration): ts.Token<ts.SyntaxKind.DotDotDotToken> | undefined {
  return utils.getValueOrUndefined(node.dotDotDotToken);
}

export function isRestParameter(node: ts.ParameterDeclaration): boolean {
  return getDotDotDotToken(node) !== undefined;
}

export function isOptional(node: ts.ParameterDeclaration): boolean {
  return getQuestionToken(node) !== undefined || isRestParameter(node) || initializer.hasInitializer(node);
}
