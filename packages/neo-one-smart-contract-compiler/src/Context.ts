// tslint:disable ban-types
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { Globals, LibAliases, LibAliasesWithReset, Libs } from './symbols';

export interface DiagnosticOptions {
  readonly error?: boolean;
  readonly warning?: boolean;
}

export class Context {
  public constructor(
    public readonly program: ts.Program,
    public readonly typeChecker: ts.TypeChecker,
    public readonly languageService: ts.LanguageService,
    public readonly globals: Globals,
    public readonly libs: Libs,
    public readonly libAliases: LibAliasesWithReset,
    private readonly mutableDiagnostics: ts.Diagnostic[] = ts.getPreEmitDiagnostics(program),
  ) {}

  public get diagnostics(): ReadonlyArray<ts.Diagnostic> {
    return this.mutableDiagnostics;
  }

  public update(
    program: ts.Program,
    typeChecker: ts.TypeChecker,
    languageService: ts.LanguageService,
    globals: Globals,
    libs: Libs,
    libAliases: LibAliasesWithReset,
  ): Context {
    return new Context(program, typeChecker, languageService, globals, libs, libAliases, [...this.mutableDiagnostics]);
  }

  public addDiagnostics(diagnostics: ReadonlyArray<ts.Diagnostic>): void {
    this.mutableDiagnostics.push(...diagnostics);
  }

  public reportError(node: ts.Node, message: string, code: DiagnosticCode): void {
    this.mutableDiagnostics.push(new CompilerDiagnostic(node, message, code, ts.DiagnosticCategory.Error));
  }

  public reportWarning(node: ts.Node, message: string, code: DiagnosticCode): void {
    this.mutableDiagnostics.push(new CompilerDiagnostic(node, message, code, ts.DiagnosticCategory.Warning));
  }

  public reportUnsupported(node: ts.Node): void {
    this.reportError(node, 'Unsupported syntax', DiagnosticCode.UNSUPPORTED_SYNTAX);
  }

  public reportTypeError(node: ts.Node): void {
    this.reportError(
      node,
      'Could not infer type. Please add an explicit type annotation.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public reportTypeWarning(node: ts.Node): void {
    this.reportWarning(
      node,
      'Could not infer type. Deoptimized implementation will be used. Add an explicit type annotation ' +
        'to optimize the output.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public getType(
    node: ts.Node,
    { warning = true, error = false }: DiagnosticOptions = { warning: true, error: false },
  ): ts.Type | undefined {
    const type = this.getNotAnyType(tsUtils.type_.getType(this.typeChecker, node));

    if (type === undefined) {
      if (error) {
        this.reportTypeError(node);
      } else if (warning) {
        this.reportTypeWarning(node);
      }
    }

    if (type !== undefined) {
      const constraintType = tsUtils.type_.getConstraint(type);
      if (constraintType !== undefined) {
        return constraintType;
      }
    }

    return type;
  }

  public getTypeOfSymbol(
    symbol: ts.Symbol | undefined,
    node: ts.Node,
    { warning = true, error = false }: DiagnosticOptions = { warning: true, error: false },
  ): ts.Type | undefined {
    if (symbol === undefined) {
      return undefined;
    }

    const type = this.getNotAnyType(tsUtils.type_.getTypeAtLocation(this.typeChecker, symbol, node));
    if (type === undefined) {
      if (error) {
        this.reportTypeError(node);
      } else if (warning) {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getSymbol(
    node: ts.Node,
    { warning = true, error = false }: DiagnosticOptions = { warning: true, error: false },
  ): ts.Symbol | undefined {
    let symbol = tsUtils.node.getSymbol(this.typeChecker, node);
    if (symbol === undefined) {
      const noWarnOrError = { warning: false, error: false };
      const type = this.getType(node, noWarnOrError);
      symbol = this.getSymbolForType(node, type, noWarnOrError);
    }

    if (symbol === undefined) {
      const message = 'Could not determine source symbol.';
      if (error) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else if (warning) {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = tsUtils.symbol.getAliasedSymbol(this.typeChecker, symbol);
    if (aliased !== undefined) {
      return aliased;
    }

    return symbol;
  }

  public getSymbolForType(
    node: ts.Node,
    type: ts.Type | undefined,
    { warning = true, error = false }: DiagnosticOptions = { warning: true, error: false },
  ): ts.Symbol | undefined {
    if (type === undefined) {
      return undefined;
    }

    const symbol = tsUtils.type_.getSymbol(type);
    if (symbol === undefined) {
      if (!tsUtils.type_.isSymbolic(type)) {
        return undefined;
      }

      const message = `Could not determine source symbol for type: ${tsUtils.type_.getText(
        this.typeChecker,
        type,
        node,
      )}.`;
      if (error) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else if (warning) {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = tsUtils.symbol.getAliasedSymbol(this.typeChecker, symbol);
    if (aliased !== undefined) {
      return aliased;
    }

    return symbol;
  }

  public isOnlyGlobal(node: ts.Node, type: ts.Type | undefined, name: keyof Globals): boolean {
    return this.isGlobalSymbol(node, this.getSymbolForType(node, type), name);
  }

  public isGlobal(node: ts.Node, type: ts.Type | undefined, name: keyof Globals): boolean {
    return this.isGlobalSymbol(node, this.getSymbolForType(node, type), name);
  }

  public hasGlobal(node: ts.Node, type: ts.Type | undefined, name: keyof Globals): boolean {
    return (
      type !== undefined &&
      tsUtils.type_.hasType(type, (testType) => this.isGlobalSymbol(node, this.getSymbolForType(node, testType), name))
    );
  }

  public isGlobalSymbol(_node: ts.Node, symbol: ts.Symbol | undefined, name: keyof Globals): boolean {
    return symbol === this.globals[name];
  }

  public isOnlyLib(node: ts.Node, type: ts.Type | undefined, name: keyof Libs): boolean {
    return this.isLibSymbol(node, this.getSymbolForType(node, type), name);
  }

  public isLibSymbol(_node: ts.Node, symbol: ts.Symbol | undefined, name: keyof Libs): boolean {
    return symbol === this.libs[name];
  }

  public isLibAlias(identifier: ts.Identifier | undefined, name: keyof LibAliases): boolean {
    if (identifier === undefined) {
      return false;
    }

    return this.libAliases[name].has(identifier);
  }

  private getNotAnyType(type: ts.Type | undefined): ts.Type | undefined {
    // tslint:disable-next-line no-bitwise
    if (type === undefined || tsUtils.type_.isAny(type)) {
      return undefined;
    }

    return type;
  }
}
