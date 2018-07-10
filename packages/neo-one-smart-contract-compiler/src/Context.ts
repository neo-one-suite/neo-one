// tslint:disable ban-types
import { DiagnosticCategory, Identifier, Node, Symbol, ts, Type, TypeFlags, TypeGuards } from 'ts-simple-ast';

import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { Globals, LibAliases, LibAliasesWithReset, Libs } from './symbols';

import * as typeUtils from './typeUtils';

export class Context {
  private readonly mutableDiagnostics: ts.Diagnostic[] = [];

  public constructor(
    public readonly globals: Globals,
    public readonly libs: Libs,
    public readonly libAliases: LibAliasesWithReset,
  ) {}

  public get diagnostics(): ReadonlyArray<ts.Diagnostic> {
    return this.mutableDiagnostics;
  }

  public addDiagnostics(diagnostics: ReadonlyArray<ts.Diagnostic>): void {
    this.mutableDiagnostics.push(...diagnostics);
  }

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.mutableDiagnostics.push(new CompilerDiagnostic(node, message, code, DiagnosticCategory.Error));
  }

  public reportWarning(node: Node, message: string, code: DiagnosticCode): void {
    this.mutableDiagnostics.push(new CompilerDiagnostic(node, message, code, DiagnosticCategory.Warning));
  }

  public reportUnsupported(node: Node): void {
    this.reportError(node, 'Unsupported syntax', DiagnosticCode.UNSUPPORTED_SYNTAX);
  }

  public reportTypeError(node: Node): void {
    this.reportError(
      node,
      'Could not infer type. Please add an explicit type annotation.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public reportTypeWarning(node: Node): void {
    this.reportWarning(
      node,
      'Could not infer type. Deoptimized implementation will be used. Add an explicit type annotation ' +
        'to optimize the output.',
      DiagnosticCode.UNKNOWN_TYPE,
    );
  }

  public getType(node: Node, required = false): Type | undefined {
    let type = this.getNotAnyType(node.getType());

    if (type === undefined && TypeGuards.isExpression(node)) {
      type = this.getNotAnyType(node.getContextualType());
    }

    if (type === undefined) {
      if (required) {
        this.reportTypeError(node);
      } else {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getTypeOfSymbol(symbol: Symbol | undefined, node: Node, required = false): Type | undefined {
    if (symbol === undefined) {
      return undefined;
    }

    const type = this.getNotAnyType(symbol.getTypeAtLocation(node));
    if (type === undefined) {
      if (required) {
        this.reportTypeError(node);
      } else {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getSymbol(node: Node, required = false): Symbol | undefined {
    const symbol = node.getSymbol();
    if (symbol === undefined) {
      const message = 'Could not determine source symbol.';
      if (required) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased !== undefined) {
      return aliased;
    }

    return symbol;
  }

  public getSymbolForType(node: Node, type: Type | undefined, required = false): Symbol | undefined {
    if (type === undefined) {
      return undefined;
    }

    const symbol = type.getSymbol();
    if (symbol === undefined) {
      const message = `Could not determine source symbol for type: ${type.getText()}.`;
      if (required) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased !== undefined) {
      return aliased;
    }

    return symbol;
  }

  public isOnlyGlobal(node: Node, type: Type | undefined, name: keyof Globals): boolean {
    return this.isSymbolic(type) && this.isGlobalSymbol(node, this.getSymbolForType(node, type), name);
  }

  public isGlobal(node: Node, type: Type | undefined, name: keyof Globals): boolean {
    return this.isSymbolic(type) && this.isGlobalSymbol(node, this.getSymbolForType(node, type), name);
  }

  public hasGlobal(node: Node, type: Type | undefined, name: keyof Globals): boolean {
    return typeUtils.hasType(
      type,
      (testType) => this.isSymbolic(testType) && this.isGlobalSymbol(node, this.getSymbolForType(node, testType), name),
    );
  }

  public isGlobalSymbol(_node: Node, symbol: Symbol | undefined, name: keyof Globals): boolean {
    return symbol === this.globals[name];
  }

  public isOnlyLib(node: Node, type: Type | undefined, name: keyof Libs): boolean {
    return this.isSymbolic(type) && this.isLibSymbol(node, this.getSymbolForType(node, type), name);
  }

  public isLibSymbol(_node: Node, symbol: Symbol | undefined, name: keyof Libs): boolean {
    return symbol === this.libs[name];
  }

  public isLibAlias(identifier: Identifier | undefined, name: keyof LibAliases): boolean {
    if (identifier === undefined) {
      return false;
    }

    return this.libAliases[name].has(identifier);
  }

  private isSymbolic(type: Type | undefined): boolean {
    return (
      type === undefined ||
      (!typeUtils.isLiteral(type) &&
        !typeUtils.isPrimitive(type) &&
        !typeUtils.isTuple(type) &&
        !typeUtils.isUnion(type) &&
        !typeUtils.isIntersection(type))
    );
  }

  private getNotAnyType(type: Type | undefined): Type | undefined {
    // tslint:disable-next-line no-bitwise
    if (type === undefined || (type.getFlags() & TypeFlags.Any) !== 0) {
      return undefined;
    }

    return type;
  }
}
