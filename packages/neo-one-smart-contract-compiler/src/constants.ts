import { SyntaxKind } from 'ts-simple-ast';

export const MAIN_FUNCTION = 'main';
export const NORMAL_COMPLETION = 0;
export const BREAK_COMPLETION = 1;
export const CONTINUE_COMPLETION = 2;
export const CATCH_COMPLETION = 3;

export const ASSIGNMENT_OPERATORS = new Set([
  SyntaxKind.EqualsToken,
  SyntaxKind.PlusEqualsToken,
  SyntaxKind.MinusEqualsToken,
  SyntaxKind.AsteriskAsteriskEqualsToken,
  SyntaxKind.AsteriskEqualsToken,
  SyntaxKind.SlashEqualsToken,
  SyntaxKind.PercentEqualsToken,
  SyntaxKind.AmpersandEqualsToken,
  SyntaxKind.BarEqualsToken,
  SyntaxKind.CaretEqualsToken,
  SyntaxKind.LessThanLessThanEqualsToken,
  SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  SyntaxKind.GreaterThanGreaterThanEqualsToken,
]);
