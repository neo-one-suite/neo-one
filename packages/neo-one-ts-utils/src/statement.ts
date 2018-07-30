import ts from 'typescript';
import { body, syntaxKind } from './base';
import * as node_ from './node';
import * as utils from './utils';
import * as variable from './variable';

export type StatementedNode =
  | ts.Block
  | ts.SourceFile
  | ts.FunctionDeclaration
  | ts.ModuleDeclaration
  | ts.FunctionLikeDeclaration
  | ts.CaseClause
  | ts.DefaultClause;

export function getStatements(node: StatementedNode): ReadonlyArray<ts.Statement> {
  if (ts.isSourceFile(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    return node.statements;
  }

  if (ts.isBlock(node)) {
    return node.statements;
  }

  let moduleBody = body.getBody(node);
  // tslint:disable-next-line no-loop-statement no-any
  while (moduleBody !== undefined && (moduleBody as any).statements == undefined) {
    // tslint:disable-next-line no-any
    moduleBody = body.getBody(moduleBody as any);
  }

  if (moduleBody === undefined) {
    throw new Error(`Could not find statements for ${syntaxKind.getSyntaxKindName(node.kind)}`);
  }

  // tslint:disable-next-line no-any
  return (moduleBody as any).statements;
}

export function getClasses(node: StatementedNode): ReadonlyArray<ts.ClassDeclaration> {
  return getStatements(node).filter(ts.isClassDeclaration);
}

export function getClass(node: StatementedNode, name: string): ts.ClassDeclaration | undefined {
  return getClasses(node).find((value) => node_.getName(value) === name);
}

export function getClassOrThrow(node: StatementedNode, name: string): ts.ClassDeclaration {
  return utils.throwIfNullOrUndefined(getClass(node, name), 'class');
}

export function getInterfaces(node: StatementedNode): ReadonlyArray<ts.InterfaceDeclaration> {
  return getStatements(node).filter(ts.isInterfaceDeclaration);
}

export function getInterface(node: StatementedNode, name: string): ts.InterfaceDeclaration | undefined {
  return getInterfaces(node).find((value) => node_.getName(value) === name);
}

export function getInterfaceOrThrow(node: StatementedNode, name: string): ts.InterfaceDeclaration {
  return utils.throwIfNullOrUndefined(getInterface(node, name), 'interface');
}

export function getNamespaces(node: StatementedNode): ReadonlyArray<ts.ModuleDeclaration> {
  return getStatements(node).filter(ts.isModuleDeclaration);
}

export function getNamespace(node: StatementedNode, name: string): ts.ModuleDeclaration | undefined {
  return getNamespaces(node).find((value) => node_.getName(value) === name);
}

export function getNamespaceOrThrow(node: StatementedNode, name: string): ts.ModuleDeclaration {
  return utils.throwIfNullOrUndefined(getNamespace(node, name), 'namespace');
}

export function getVariableStatements(node: StatementedNode): ReadonlyArray<ts.VariableStatement> {
  return getStatements(node).filter(ts.isVariableStatement);
}

export function getVariableDeclarations(node: StatementedNode): ReadonlyArray<ts.VariableDeclaration> {
  return getVariableStatements(node).reduce<ReadonlyArray<ts.VariableDeclaration>>(
    (acc, value) => acc.concat(variable.getDeclarations(variable.getDeclarationList(value))),
    [],
  );
}

export function getVariableDeclaration(node: StatementedNode, name: string): ts.VariableDeclaration | undefined {
  return getVariableDeclarations(node).find((value) => node_.getName(value) === name);
}

export function getVariableDeclarationOrThrow(node: StatementedNode, name: string): ts.VariableDeclaration {
  return utils.throwIfNullOrUndefined(getVariableDeclaration(node, name), 'variable declaration');
}

export function getTypeAliases(node: StatementedNode): ReadonlyArray<ts.TypeAliasDeclaration> {
  return getStatements(node).filter(ts.isTypeAliasDeclaration);
}

export function getTypeAlias(node: StatementedNode, name: string): ts.TypeAliasDeclaration | undefined {
  return getTypeAliases(node).find((value) => node_.getName(value) === name);
}

export function getTypeAliasOrThrow(node: StatementedNode, name: string): ts.TypeAliasDeclaration {
  return utils.throwIfNullOrUndefined(getTypeAlias(node, name), 'type alias');
}

export function getFunctions(node: StatementedNode): ReadonlyArray<ts.FunctionDeclaration> {
  return getStatements(node).filter(ts.isFunctionDeclaration);
}

export function getFunction(node: StatementedNode, name: string): ts.FunctionDeclaration | undefined {
  return getFunctions(node).find((value) => node_.getName(value) === name);
}

export function getFunctionOrThrow(node: StatementedNode, name: string): ts.FunctionDeclaration {
  return utils.throwIfNullOrUndefined(getFunction(node, name), 'function');
}

export function getLabel(node: ts.BreakStatement | ts.ContinueStatement): ts.Identifier | undefined {
  return utils.getValueOrUndefined(node.label);
}

export function getClauses(node: ts.CaseBlock): ReadonlyArray<ts.CaseOrDefaultClause> {
  return node.clauses;
}

export function getOnlyVariableDeclaration(node: ts.CatchClause): ts.VariableDeclaration | undefined {
  return utils.getValueOrUndefined(node.variableDeclaration);
}

export function getBlock(node: ts.CatchClause): ts.Block {
  return node.block;
}

export function getStatement(node: ts.DoStatement | ts.ForStatement | ts.WhileStatement): ts.Statement {
  return node.statement;
}

export function getInitializer(node: ts.ForStatement): ts.VariableDeclarationList | ts.Expression | undefined {
  return utils.getValueOrUndefined(node.initializer);
}

export function getCondition(node: ts.ForStatement): ts.Expression | undefined {
  return utils.getValueOrUndefined(node.condition);
}

export function getIncrementor(node: ts.ForStatement): ts.Expression | undefined {
  return utils.getValueOrUndefined(node.incrementor);
}

export function getThenStatement(node: ts.IfStatement): ts.Statement {
  return node.thenStatement;
}

export function getElseStatement(node: ts.IfStatement): ts.Statement | undefined {
  return utils.getValueOrUndefined(node.elseStatement);
}

export function getCaseBlock(node: ts.SwitchStatement): ts.CaseBlock {
  return node.caseBlock;
}

export function getCatchClause(node: ts.TryStatement): ts.CatchClause | undefined {
  return utils.getValueOrUndefined(node.catchClause);
}

export function getTryBlock(node: ts.TryStatement): ts.Block {
  return node.tryBlock;
}

export function getFinallyBlock(node: ts.TryStatement): ts.Block | undefined {
  return utils.getValueOrUndefined(node.finallyBlock);
}
