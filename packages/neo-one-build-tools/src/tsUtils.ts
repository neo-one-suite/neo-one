import ts from 'typescript';

function getSyntaxKindName(kind: ts.SyntaxKind): string {
  return getKindCache()[kind];
}

function getValueOrUndefined<T>(value: T | null | undefined): T | undefined {
  return value == undefined ? undefined : value;
}

// tslint:disable-next-line no-let readonly-keyword
let mutableKindCache: { [kind: number]: string } | undefined;

function getKindCache() {
  if (mutableKindCache !== undefined) {
    return mutableKindCache;
  }
  mutableKindCache = {};

  // some SyntaxKinds are repeated, so only use the first one
  // tslint:disable-next-line no-loop-statement
  for (const name of Object.keys(ts.SyntaxKind).filter((k) => isNaN(parseInt(k, 10)))) {
    // tslint:disable-next-line no-any
    const value = (ts.SyntaxKind as any)[name] as number;
    if ((mutableKindCache[value] as string | undefined) === undefined) {
      mutableKindCache[value] = name;
    }
  }

  return mutableKindCache;
}

type BodiedNode = ts.Node & { readonly body: ts.Node };
type BodyableNode = ts.Node & { readonly body?: ts.Node };

function getBody(node: BodiedNode): ts.Node;
function getBody(node: BodyableNode): ts.Node | undefined;
function getBody(node: BodiedNode | BodyableNode): ts.Node | undefined {
  return getValueOrUndefined(node.body);
}

type StatementedNode =
  | ts.Block
  | ts.SourceFile
  | ts.FunctionDeclaration
  | ts.ModuleDeclaration
  | ts.FunctionLikeDeclaration
  | ts.CaseClause
  | ts.DefaultClause;

function getStatements(node: StatementedNode): readonly ts.Statement[] {
  if (ts.isSourceFile(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    return node.statements;
  }

  if (ts.isBlock(node)) {
    return node.statements;
  }

  let moduleBody = getBody(node);
  // tslint:disable-next-line no-loop-statement no-any
  while (moduleBody !== undefined && (moduleBody as any).statements == undefined) {
    // tslint:disable-next-line no-any
    moduleBody = getBody(moduleBody as any);
  }

  if (moduleBody === undefined) {
    throw new Error(`Could not find statements for ${getSyntaxKindName(node.kind)}`);
  }

  // tslint:disable-next-line no-any
  return (moduleBody as any).statements;
}

// tslint:disable-next-line: export-name
export function getImportDeclarations(node: ts.SourceFile): readonly ts.ImportDeclaration[] {
  return getStatements(node).filter(ts.isImportDeclaration);
}

export function getModuleSpecifier(node: ts.ImportDeclaration | ts.ExportDeclaration): ts.StringLiteral | undefined {
  const moduleSpecifier = getValueOrUndefined(node.moduleSpecifier);
  if (moduleSpecifier === undefined) {
    return undefined;
  }

  if (!ts.isStringLiteral(moduleSpecifier)) {
    return undefined;
  }

  return moduleSpecifier;
}
