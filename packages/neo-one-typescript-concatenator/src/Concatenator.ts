import { AnyNameableNode, symbolKey, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import toposort from 'toposort';
import ts from 'typescript';

export interface ConcatenatorContext {
  readonly typeChecker: ts.TypeChecker;
  readonly program: ts.Program;
  readonly languageService: ts.LanguageService;
  readonly getSymbol: (node: ts.Node) => ts.Symbol | undefined;
  readonly isIgnoreFile: (node: ts.ClassDeclaration) => boolean;
  readonly isGlobalIdentifier: (value: string) => boolean;
  readonly isGlobalFile: (node: ts.SourceFile) => boolean;
  readonly isGlobalSymbol: (node: ts.Symbol) => boolean;
}

export interface ConcatenatorOptions {
  readonly context: ConcatenatorContext;
  readonly sourceFile: ts.SourceFile;
}

export class Concatenator {
  public readonly sourceFiles: ReadonlyArray<ts.SourceFile>;

  private readonly sourceFile: ts.SourceFile;
  private readonly context: ConcatenatorContext;
  private readonly duplicateIdentifiers: Set<string>;
  private readonly sourceFileImported = new Set<ts.SourceFile>();
  private readonly sourceFileToImports: Map<ts.SourceFile, ts.ImportDeclaration> = new Map<
    ts.SourceFile,
    ts.ImportDeclaration
  >();

  public constructor(options: ConcatenatorOptions) {
    this.sourceFile = options.sourceFile;
    this.context = options.context;
    this.sourceFiles = this.getAllSourceFiles(this.sourceFile);
    this.duplicateIdentifiers = this.getAllDuplicateIdentifiers();
    this.consolidateAllImports();
  }

  public readonly substituteNode = (_hint: ts.EmitHint, node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      return this.getIdentifierForIdentifier(node);
    }

    if (ts.isImportDeclaration(node)) {
      return this.isConcatenatedImport(node)
        ? tsUtils.setOriginal(ts.createNotEmittedStatement(node), node)
        : this.getCombinedImport(node);
    }

    if (ts.isExportAssignment(node)) {
      const identifier = this.getIdentifierForNode(node);
      if (identifier === undefined) {
        return node;
      }

      const expression = node.expression;
      if (ts.isFunctionExpression(expression)) {
        return tsUtils.setOriginal(
          ts.createFunctionDeclaration(
            expression.decorators,
            expression.modifiers,
            expression.asteriskToken,
            identifier,
            expression.typeParameters,
            expression.parameters,
            expression.type,
            expression.body,
          ),
          node,
        );
      }

      return tsUtils.setOriginalRecursive(
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(identifier, undefined, node.expression)],
            ts.NodeFlags.Const,
          ),
        ),
        node,
      );
    }

    if (ts.isVariableStatement(node) && tsUtils.modifier.isNamedExport(node)) {
      return tsUtils.setOriginal(
        ts.createVariableStatement(
          node.modifiers === undefined
            ? undefined
            : node.modifiers.filter((modifier) => modifier.kind !== ts.SyntaxKind.ExportKeyword),
          node.declarationList,
        ),
        node,
      );
    }

    if (
      ts.isClassDeclaration(node) &&
      ((tsUtils.modifier.isNamedExport(node) && !this.isIgnoreFileInternal(node)) ||
        tsUtils.modifier.isDefaultExport(node))
    ) {
      return tsUtils.setOriginal(
        ts.updateClassDeclaration(
          node,
          node.decorators,
          node.modifiers === undefined
            ? undefined
            : node.modifiers.filter(
                (modifier) =>
                  modifier.kind !== ts.SyntaxKind.ExportKeyword && modifier.kind !== ts.SyntaxKind.DefaultKeyword,
              ),
          node.name,
          node.typeParameters,
          node.heritageClauses,
          node.members,
        ),
        node,
      );
    }

    if (
      (ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) &&
      (tsUtils.modifier.isNamedExport(node) || tsUtils.modifier.isDefaultExport(node))
    ) {
      return tsUtils.setOriginal(
        ts.createFunctionDeclaration(
          node.decorators,
          this.filterModifiers(node.modifiers),
          node.asteriskToken,
          node.name === undefined ? this.getIdentifierForNode(node) : node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          node.body,
        ),
        node,
      );
    }

    if (ts.isInterfaceDeclaration(node) && tsUtils.modifier.isNamedExport(node)) {
      return tsUtils.setOriginal(
        ts.createInterfaceDeclaration(
          node.decorators,
          this.filterModifiers(node.modifiers),
          node.name,
          node.typeParameters,
          node.heritageClauses,
          node.members,
        ),
        node,
      );
    }

    if (ts.isTypeAliasDeclaration(node) && tsUtils.modifier.isNamedExport(node)) {
      return tsUtils.setOriginal(
        ts.createTypeAliasDeclaration(
          node.decorators,
          this.filterModifiers(node.modifiers),
          node.name,
          node.typeParameters,
          node.type,
        ),
        node,
      );
    }

    if (
      ts.isEnumDeclaration(node) &&
      (tsUtils.modifier.isNamedExport(node) || tsUtils.modifier.isDefaultExport(node))
    ) {
      return tsUtils.setOriginal(
        ts.createEnumDeclaration(node.decorators, this.filterModifiers(node.modifiers), node.name, node.members),
        node,
      );
    }

    if (ts.isExportDeclaration(node)) {
      return tsUtils.setOriginal(ts.createNotEmittedStatement(node), node);
    }

    if (ts.isPropertyAccessExpression(node)) {
      const name = tsUtils.node.getNameNode(node);
      const identifier = this.getIdentifierForNode(name);

      return identifier === undefined ? node : identifier;
    }

    return node;
  };

  private getCombinedImport(node: ts.ImportDeclaration): ts.Statement {
    const sourceFile = tsUtils.importExport.getModuleSpecifierSourceFile(this.context.typeChecker, node);
    if (sourceFile === undefined) {
      return node;
    }

    if (this.sourceFileImported.has(sourceFile)) {
      return tsUtils.setOriginal(ts.createNotEmittedStatement(node), node);
    }
    this.sourceFileImported.add(sourceFile);

    const importDecl = this.sourceFileToImports.get(sourceFile);

    return importDecl === undefined ? tsUtils.setOriginal(ts.createNotEmittedStatement(node), node) : importDecl;
  }

  private isIgnoreFileInternal(node: ts.ClassDeclaration): boolean {
    return tsUtils.node.getSourceFile(node) === this.sourceFile && this.context.isIgnoreFile(node);
  }

  private getAllSourceFiles(sourceFile: ts.SourceFile): ReadonlyArray<ts.SourceFile> {
    const sourceFilesMap = this.getAllSourceFilesWorker(sourceFile);
    const graph = _.flatten(
      [...sourceFilesMap.entries()].map(([file, files]) =>
        files.map<[string, string]>((upstreamFile) => [file.fileName, upstreamFile.fileName]),
      ),
    );
    const sorted = _.reverse(toposort(graph));
    const filePathToSourceFile = new Map(
      [...sourceFilesMap.keys()].map<[string, ts.SourceFile]>((file) => [file.fileName, file]),
    );

    return sorted.map((filePath) => filePathToSourceFile.get(filePath)).filter(utils.notNull);
  }

  private getAllSourceFilesWorker(sourceFile: ts.SourceFile): Map<ts.SourceFile, ReadonlyArray<ts.SourceFile>> {
    const sourceFileMap = new Map<ts.SourceFile, ReadonlyArray<ts.SourceFile>>();
    const importSourceFiles = tsUtils.statement
      .getStatements(sourceFile)
      .filter(ts.isImportDeclaration)
      .map((decl) => {
        const file = tsUtils.importExport.getModuleSpecifierSourceFile(this.context.typeChecker, decl);
        if (this.isConcatenatedImport(decl) && file !== undefined) {
          this.sourceFileImported.add(file);

          return file;
        }

        return undefined;
      })
      .filter(utils.notNull);
    const exportSourceFiles = tsUtils.statement
      .getStatements(sourceFile)
      .filter(ts.isExportDeclaration)
      .map((decl) => {
        const file = tsUtils.importExport.getModuleSpecifierSourceFile(this.context.typeChecker, decl);
        if (!this.isBuiltinFile(decl) && file !== undefined) {
          this.sourceFileImported.add(file);

          return file;
        }

        return undefined;
      })
      .filter(utils.notNull);
    const sourceFiles = [...new Set(importSourceFiles.concat(exportSourceFiles))];
    sourceFileMap.set(sourceFile, sourceFiles);
    sourceFiles.forEach((importedFile) => {
      this.getAllSourceFilesWorker(importedFile).forEach((files, file) => {
        sourceFileMap.set(file, files);
      });
    });

    return sourceFileMap;
  }

  private getAllDuplicateIdentifiers(): Set<string> {
    const fileIdentifiers = this.sourceFiles.map((file) => this.getAllIdentifiersForFile(file));
    const duplicateIdentifiers = new Set<string>();

    fileIdentifiers.forEach((identifiers) => {
      identifiers.forEach((identifier) => {
        if (
          !duplicateIdentifiers.has(identifier) &&
          (this.context.isGlobalIdentifier(identifier) ||
            fileIdentifiers.some(
              (otherIdentifiers) => identifiers !== otherIdentifiers && otherIdentifiers.has(identifier),
            ))
        ) {
          duplicateIdentifiers.add(identifier);
        }
      });
    });

    return duplicateIdentifiers;
  }

  private getAllIdentifiersForFile(file: ts.SourceFile): Set<string> {
    const identifiers = new Set<string>();

    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && this.isContainerSourceFileForDeclaration(node)) {
        const symbol = this.context.getSymbol(node);
        const declarations = symbol === undefined ? [] : tsUtils.symbol.getDeclarations(symbol);
        if (
          symbol !== undefined &&
          declarations.length > 0 &&
          tsUtils.node.getSourceFile(node) === tsUtils.node.getSourceFile(declarations[0])
        ) {
          identifiers.add(tsUtils.symbol.getName(symbol));
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(file, visit);

    return identifiers;
  }

  private consolidateAllImports(): void {
    this.sourceFiles.forEach((sourceFile) => {
      this.consolidateAllImportsForFile(sourceFile);
    });
  }

  private consolidateAllImportsForFile(node: ts.SourceFile): void {
    tsUtils.statement
      .getStatements(node)
      .filter(ts.isImportDeclaration)
      .forEach((decl) => {
        this.consolidateImports(decl);
      });
  }

  private consolidateImports(node: ts.ImportDeclaration): void {
    const file = tsUtils.importExport.getModuleSpecifierSourceFile(this.context.typeChecker, node);
    if (file === undefined) {
      return;
    }

    const namedImports = tsUtils.importDeclaration
      .getNamedImports(node)
      .map((namedImport) =>
        tsUtils.setOriginal(
          ts.createImportSpecifier(
            undefined,
            namedImport.propertyName === undefined
              ? this.getIdentifierForIdentifier(namedImport.name)
              : this.getIdentifierForIdentifier(namedImport.propertyName),
          ),
          namedImport,
        ),
      );
    const existingImport = this.sourceFileToImports.get(file);
    const moduleSpecifier = this.context.isGlobalFile(file)
      ? ts.isStringLiteral(node.moduleSpecifier)
        ? tsUtils.setOriginal(ts.createStringLiteral(node.moduleSpecifier.text), node.moduleSpecifier)
        : node.moduleSpecifier
      : tsUtils.setOriginal(ts.createStringLiteral(tsUtils.file.getFilePath(file)), node.moduleSpecifier);
    if (existingImport === undefined) {
      this.sourceFileToImports.set(
        file,
        tsUtils.setOriginalRecursive(
          ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(undefined, ts.createNamedImports(namedImports)),
            moduleSpecifier,
          ),
          node,
        ),
      );
    } else {
      const existingNamedImports = tsUtils.importDeclaration.getNamedImports(existingImport);
      const existingNames = new Set(existingNamedImports.map((namedImport) => namedImport.name.text));
      const filteredImports = namedImports.filter((namedImport) => !existingNames.has(namedImport.name.text));

      this.sourceFileToImports.set(
        file,
        tsUtils.setOriginalRecursive(
          ts.createImportDeclaration(
            undefined,
            undefined,
            ts.createImportClause(undefined, ts.createNamedImports(existingNamedImports.concat(filteredImports))),
            moduleSpecifier,
          ),
          existingImport,
        ),
      );
    }
  }

  private filterModifiers(modifiers: ReadonlyArray<ts.Modifier> | undefined): ReadonlyArray<ts.Modifier> | undefined {
    if (modifiers === undefined) {
      return undefined;
    }

    return modifiers.filter(
      (modifier) => modifier.kind !== ts.SyntaxKind.ExportKeyword && modifier.kind !== ts.SyntaxKind.DefaultKeyword,
    );
  }

  private getIdentifierForIdentifier(node: ts.Identifier): ts.Identifier {
    if (!tsUtils.isOriginal(node)) {
      return node;
    }

    const identifier = this.getIdentifierForNode(node);

    return identifier === undefined ? node : identifier;
  }

  private getIdentifierForNode(node: ts.Node): ts.Identifier | undefined {
    const identifier = this.getIdentifierStringForSymbol(this.context.getSymbol(node));

    return identifier === undefined ? undefined : tsUtils.setOriginal(ts.createIdentifier(identifier), node);
  }

  private getIdentifierStringForSymbol(symbol: ts.Symbol | undefined): string | undefined {
    if (symbol === undefined) {
      return undefined;
    }

    let identifier: string | undefined;
    if (this.context.isGlobalSymbol(symbol)) {
      identifier = tsUtils.symbol.getName(symbol);
    }

    if (identifier === undefined && this.isContainerSourceFileForDeclarationSymbol(symbol)) {
      identifier =
        this.isDuplicateIdentifier(symbol) || tsUtils.symbol.getName(symbol) === 'default'
          ? `s${symbolKey(symbol)}`
          : tsUtils.symbol.getName(symbol);
    }

    return identifier;
  }

  private isDuplicateIdentifier(symbol: ts.Symbol): boolean {
    return this.duplicateIdentifiers.has(tsUtils.symbol.getName(symbol));
  }

  private isContainerSourceFileForDeclaration(node: ts.Node): boolean {
    return this.isContainerSourceFileForDeclarationSymbol(this.context.getSymbol(node));
  }

  private isContainerSourceFileForDeclarationSymbol(symbol: ts.Symbol | undefined): boolean {
    if (symbol === undefined) {
      return false;
    }

    const declarations = tsUtils.symbol.getDeclarations(symbol);

    return declarations.length > 0 && this.isContainerSourceFile(declarations[0]);
  }

  private isContainerSourceFile(node: ts.Node): boolean {
    const firstAncestor = tsUtils.node.getFirstAncestorByTest(
      node,
      (value): value is ts.Node =>
        ts.isSourceFile(value) || ts.isFunctionLike(value) || ts.isBlock(value) || tsUtils.guards.isDeclaration(value),
    );

    return firstAncestor !== undefined && ts.isSourceFile(firstAncestor);
  }

  private isConcatenatedImport(node: ts.ImportDeclaration): boolean {
    return this.hasValueReference(node) && !this.isBuiltinFile(node);
  }

  private isBuiltinFile(node: ts.ImportDeclaration | ts.ExportDeclaration): boolean {
    const file = tsUtils.importExport.getModuleSpecifierSourceFile(this.context.typeChecker, node);
    if (file === undefined) {
      return false;
    }

    return this.context.isGlobalFile(file);
  }

  private hasValueReference(node: ts.ImportDeclaration): boolean {
    const currentSourceFile = tsUtils.node.getSourceFile(node);

    const namespaceImport = tsUtils.importDeclaration.getNamespaceImport(node);
    if (namespaceImport !== undefined && this.hasLocalValueReferences(currentSourceFile, namespaceImport)) {
      return true;
    }

    const defaultImport = tsUtils.importDeclaration.getDefaultImport(node);
    if (defaultImport !== undefined && this.hasLocalValueReferences(currentSourceFile, defaultImport)) {
      return true;
    }

    const namedImports = tsUtils.importDeclaration.getNamedImports(node);
    if (
      namedImports.some((namedImport) =>
        this.hasLocalValueReferences(currentSourceFile, this.getImportNameNode(namedImport)),
      )
    ) {
      return true;
    }

    return false;
  }

  private hasLocalValueReferences(currentSourceFile: ts.SourceFile, node: AnyNameableNode): boolean {
    const references = tsUtils.reference.findReferencesAsNodes(
      this.context.program,
      this.context.languageService,
      node,
    );

    return references.some(
      (reference) =>
        tsUtils.node.getSourceFile(reference) === currentSourceFile &&
        tsUtils.node.getFirstAncestorByTest(reference, ts.isImportDeclaration) === undefined &&
        !tsUtils.node.isPartOfTypeNode(reference),
    );
  }

  private getImportNameNode(node: ts.ImportSpecifier): ts.ImportSpecifier | ts.Identifier {
    const alias = tsUtils.node.getPropertyNameNode(node);

    return alias === undefined ? node : alias;
  }
}
