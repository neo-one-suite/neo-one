// tslint:disable
import ts from 'typescript';

export function isPrimaryExpression(node: ts.Node): node is ts.PrimaryExpression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isDeclaration(node: ts.Node): node is ts.Declaration {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.TypeParameter:
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.VariableDeclaration:
    case ts.SyntaxKind.Parameter:
    case ts.SyntaxKind.BindingElement:
    case ts.SyntaxKind.PropertySignature:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.PropertyAssignment:
    case ts.SyntaxKind.ShorthandPropertyAssignment:
    case ts.SyntaxKind.SpreadAssignment:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.SemicolonClassElement:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.TypeLiteral:
    case ts.SyntaxKind.MappedType:
    case ts.SyntaxKind.BinaryExpression:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.JsxAttribute:
    case ts.SyntaxKind.JsxSpreadAttribute:
    case ts.SyntaxKind.MissingDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.EnumMember:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.ModuleDeclaration:
    case ts.SyntaxKind.ImportEqualsDeclaration:
    case ts.SyntaxKind.ImportClause:
    case ts.SyntaxKind.NamespaceImport:
    case ts.SyntaxKind.NamespaceExportDeclaration:
    case ts.SyntaxKind.ExportDeclaration:
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier:
    case ts.SyntaxKind.ExportAssignment:
    case ts.SyntaxKind.JSDocFunctionType:
    case ts.SyntaxKind.JSDocTypedefTag:
    case ts.SyntaxKind.JSDocCallbackTag:
    case ts.SyntaxKind.JSDocSignature:
    case ts.SyntaxKind.JSDocPropertyTag:
    case ts.SyntaxKind.JSDocParameterTag:
    case ts.SyntaxKind.SourceFile:
      return true;
    default:
      return false;
  }
}

export function isMemberExpression(node: ts.Node): node is ts.MemberExpression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.TaggedTemplateExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isLeftHandSideExpression(node: ts.Node): node is ts.LeftHandSideExpression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.PartiallyEmittedExpression:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.TaggedTemplateExpression:
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isUpdateExpression(node: ts.Node): node is ts.UpdateExpression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.PartiallyEmittedExpression:
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.PostfixUnaryExpression:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.TaggedTemplateExpression:
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isUnaryExpression(node: ts.Node): node is ts.UnaryExpression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.PartiallyEmittedExpression:
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.PostfixUnaryExpression:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.DeleteExpression:
    case ts.SyntaxKind.TypeOfExpression:
    case ts.SyntaxKind.VoidExpression:
    case ts.SyntaxKind.AwaitExpression:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.TaggedTemplateExpression:
    case ts.SyntaxKind.TypeAssertionExpression:
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isExpression(node: ts.Node): node is ts.Expression {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.OmittedExpression:
    case ts.SyntaxKind.PartiallyEmittedExpression:
    case ts.SyntaxKind.PrefixUnaryExpression:
    case ts.SyntaxKind.PostfixUnaryExpression:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.ThisKeyword:
    case ts.SyntaxKind.SuperKeyword:
    case ts.SyntaxKind.ImportKeyword:
    case ts.SyntaxKind.DeleteExpression:
    case ts.SyntaxKind.TypeOfExpression:
    case ts.SyntaxKind.VoidExpression:
    case ts.SyntaxKind.AwaitExpression:
    case ts.SyntaxKind.YieldExpression:
    case ts.SyntaxKind.SyntheticExpression:
    case ts.SyntaxKind.BinaryExpression:
    case ts.SyntaxKind.ConditionalExpression:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.SpreadElement:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.TaggedTemplateExpression:
    case ts.SyntaxKind.AsExpression:
    case ts.SyntaxKind.TypeAssertionExpression:
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.MetaProperty:
    case ts.SyntaxKind.JsxElement:
    case ts.SyntaxKind.JsxOpeningElement:
    case ts.SyntaxKind.JsxSelfClosingElement:
    case ts.SyntaxKind.JsxFragment:
    case ts.SyntaxKind.JsxOpeningFragment:
    case ts.SyntaxKind.JsxClosingFragment:
    case ts.SyntaxKind.JsxExpression:
    case ts.SyntaxKind.CommaListExpression:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isNamedDeclaration(node: ts.Node): node is ts.NamedDeclaration {
  switch (node.kind) {
    case ts.SyntaxKind.TypeParameter:
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.VariableDeclaration:
    case ts.SyntaxKind.Parameter:
    case ts.SyntaxKind.BindingElement:
    case ts.SyntaxKind.PropertySignature:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.PropertyAssignment:
    case ts.SyntaxKind.ShorthandPropertyAssignment:
    case ts.SyntaxKind.SpreadAssignment:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.SemicolonClassElement:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.JsxAttribute:
    case ts.SyntaxKind.JsxSpreadAttribute:
    case ts.SyntaxKind.MissingDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.EnumMember:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.ModuleDeclaration:
    case ts.SyntaxKind.ImportEqualsDeclaration:
    case ts.SyntaxKind.ImportClause:
    case ts.SyntaxKind.NamespaceImport:
    case ts.SyntaxKind.NamespaceExportDeclaration:
    case ts.SyntaxKind.ExportDeclaration:
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier:
    case ts.SyntaxKind.ExportAssignment:
    case ts.SyntaxKind.JSDocFunctionType:
    case ts.SyntaxKind.JSDocTypedefTag:
    case ts.SyntaxKind.JSDocCallbackTag:
      return true;
    default:
      return false;
  }
}

export function isDeclarationStatement(node: ts.Node): node is ts.DeclarationStatement {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MissingDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.ModuleDeclaration:
    case ts.SyntaxKind.ImportEqualsDeclaration:
    case ts.SyntaxKind.NamespaceExportDeclaration:
    case ts.SyntaxKind.ExportDeclaration:
    case ts.SyntaxKind.ExportAssignment:
      return true;
    default:
      return false;
  }
}

export function isStatement(node: ts.Node): node is ts.Statement {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.NotEmittedStatement:
    case ts.SyntaxKind.EmptyStatement:
    case ts.SyntaxKind.DebuggerStatement:
    case ts.SyntaxKind.MissingDeclaration:
    case ts.SyntaxKind.Block:
    case ts.SyntaxKind.VariableStatement:
    case ts.SyntaxKind.ExpressionStatement:
    case ts.SyntaxKind.IfStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.ForStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.ForOfStatement:
    case ts.SyntaxKind.BreakStatement:
    case ts.SyntaxKind.ContinueStatement:
    case ts.SyntaxKind.ReturnStatement:
    case ts.SyntaxKind.WithStatement:
    case ts.SyntaxKind.SwitchStatement:
    case ts.SyntaxKind.LabeledStatement:
    case ts.SyntaxKind.ThrowStatement:
    case ts.SyntaxKind.TryStatement:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.ModuleDeclaration:
    case ts.SyntaxKind.ModuleBlock:
    case ts.SyntaxKind.ImportEqualsDeclaration:
    case ts.SyntaxKind.ImportDeclaration:
    case ts.SyntaxKind.NamespaceExportDeclaration:
    case ts.SyntaxKind.ExportDeclaration:
    case ts.SyntaxKind.ExportAssignment:
      return true;
    default:
      return false;
  }
}

export function isSignatureDeclarationBase(node: ts.Node): node is ts.SignatureDeclarationBase {
  switch (node.kind) {
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.JSDocFunctionType:
      return true;
    default:
      return false;
  }
}

export function isParameterDeclaration(node: ts.Node): node is ts.ParameterDeclaration {
  switch (node.kind) {
    case ts.SyntaxKind.Parameter:
      return true;
    default:
      return false;
  }
}

export function isFunctionLikeDeclarationBase(node: ts.Node): node is ts.FunctionLikeDeclarationBase {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
      return true;
    default:
      return false;
  }
}

export function isKeywordTypeNode(node: ts.Node): node is ts.KeywordTypeNode {
  switch (node.kind) {
    case ts.SyntaxKind.ThisKeyword:
      return true;
    default:
      return false;
  }
}

export function isNodeWithTypeArguments(node: ts.Node): node is ts.NodeWithTypeArguments {
  switch (node.kind) {
    case ts.SyntaxKind.ImportType:
    case ts.SyntaxKind.TypeReference:
    case ts.SyntaxKind.ExpressionWithTypeArguments:
      return true;
    default:
      return false;
  }
}

export function isFunctionOrConstructorTypeNodeBase(node: ts.Node): node is ts.FunctionOrConstructorTypeNodeBase {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
      return true;
    default:
      return false;
  }
}

export function isOptionalTypeNode(node: ts.Node): node is ts.OptionalTypeNode {
  switch (node.kind) {
    case ts.SyntaxKind.OptionalType:
      return true;
    default:
      return false;
  }
}

export function isRestTypeNode(node: ts.Node): node is ts.RestTypeNode {
  switch (node.kind) {
    case ts.SyntaxKind.RestType:
      return true;
    default:
      return false;
  }
}

export function isLiteralLikeNode(node: ts.Node): node is ts.LiteralLikeNode {
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.RegularExpressionLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.TemplateHead:
    case ts.SyntaxKind.TemplateMiddle:
    case ts.SyntaxKind.TemplateTail:
      return true;
    default:
      return false;
  }
}

export function isPartiallyEmittedExpression(node: ts.Node): node is ts.PartiallyEmittedExpression {
  switch (node.kind) {
    case ts.SyntaxKind.PartiallyEmittedExpression:
      return true;
    default:
      return false;
  }
}

export function isNullLiteral(node: ts.Node): node is ts.NullLiteral {
  switch (node.kind) {
    case ts.SyntaxKind.NullKeyword:
      return true;
    default:
      return false;
  }
}

export function isBooleanLiteral(node: ts.Node): node is ts.BooleanLiteral {
  switch (node.kind) {
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      return true;
    default:
      return false;
  }
}

export function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  switch (node.kind) {
    case ts.SyntaxKind.ThisKeyword:
      return true;
    default:
      return false;
  }
}

export function isSuperExpression(node: ts.Node): node is ts.SuperExpression {
  switch (node.kind) {
    case ts.SyntaxKind.SuperKeyword:
      return true;
    default:
      return false;
  }
}

export function isImportExpression(node: ts.Node): node is ts.ImportExpression {
  switch (node.kind) {
    case ts.SyntaxKind.ImportKeyword:
      return true;
    default:
      return false;
  }
}

export function isSyntheticExpression(node: ts.Node): node is ts.SyntheticExpression {
  switch (node.kind) {
    case ts.SyntaxKind.SyntheticExpression:
      return true;
    default:
      return false;
  }
}

export function isObjectLiteralExpressionBase(node: ts.Node): node is ts.ObjectLiteralExpressionBase<any> {
  switch (node.kind) {
    case ts.SyntaxKind.ObjectLiteralExpression:
      return true;
    default:
      return false;
  }
}

export function isNotEmittedStatement(node: ts.Node): node is ts.NotEmittedStatement {
  switch (node.kind) {
    case ts.SyntaxKind.NotEmittedStatement:
      return true;
    default:
      return false;
  }
}

export function isCommaListExpression(node: ts.Node): node is ts.CommaListExpression {
  switch (node.kind) {
    case ts.SyntaxKind.CommaListExpression:
      return true;
    default:
      return false;
  }
}

export function isClassLikeDeclarationBase(node: ts.Node): node is ts.ClassLikeDeclarationBase {
  switch (node.kind) {
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression:
      return true;
    default:
      return false;
  }
}

export function isJSDocType(node: ts.Node): node is ts.JSDocType {
  switch (node.kind) {
    case ts.SyntaxKind.JSDocAllType:
    case ts.SyntaxKind.JSDocUnknownType:
    case ts.SyntaxKind.JSDocNonNullableType:
    case ts.SyntaxKind.JSDocNullableType:
    case ts.SyntaxKind.JSDocOptionalType:
    case ts.SyntaxKind.JSDocFunctionType:
    case ts.SyntaxKind.JSDocVariadicType:
    case ts.SyntaxKind.JSDocSignature:
    case ts.SyntaxKind.JSDocTypeLiteral:
      return true;
    default:
      return false;
  }
}

export function isJSDocTag(node: ts.Node): node is ts.JSDocTag {
  switch (node.kind) {
    case ts.SyntaxKind.JSDocTag:
    case ts.SyntaxKind.JSDocAugmentsTag:
    case ts.SyntaxKind.JSDocClassTag:
    case ts.SyntaxKind.JSDocThisTag:
    case ts.SyntaxKind.JSDocTemplateTag:
    case ts.SyntaxKind.JSDocReturnTag:
    case ts.SyntaxKind.JSDocTypeTag:
    case ts.SyntaxKind.JSDocTypedefTag:
    case ts.SyntaxKind.JSDocCallbackTag:
    case ts.SyntaxKind.JSDocPropertyTag:
    case ts.SyntaxKind.JSDocParameterTag:
      return true;
    default:
      return false;
  }
}

export function isJSDocUnknownTag(node: ts.Node): node is ts.JSDocUnknownTag {
  switch (node.kind) {
    case ts.SyntaxKind.JSDocTag:
      return true;
    default:
      return false;
  }
}

export function isInputFiles(node: ts.Node): node is ts.InputFiles {
  switch (node.kind) {
    case ts.SyntaxKind.InputFiles:
      return true;
    default:
      return false;
  }
}

export function isJsonMinusNumericLiteral(node: ts.Node): node is ts.JsonMinusNumericLiteral {
  switch (node.kind) {
    case ts.SyntaxKind.PrefixUnaryExpression:
      return true;
    default:
      return false;
  }
}
