// tslint:disable ban-types
import {
  DiagnosticCategory,
  Node,
  Symbol,
  Type,
  TypeFlags,
  TypeGuards,
  ts,
  Identifier,
} from 'ts-simple-ast';

import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { Globals, Libs, LibAliases } from './symbols';

import * as typeUtils from './typeUtils';

export class Context {
  public readonly diagnostics: ts.Diagnostic[] = [];

  constructor(
    private readonly globals: Globals,
    private readonly libs: Libs,
    private readonly libAliases: LibAliases,
  ) {}

  public reportError(node: Node, message: string, code: DiagnosticCode): void {
    this.diagnostics.push(
      new CompilerDiagnostic(node, message, code, DiagnosticCategory.Error),
    );
  }

  public reportWarning(
    node: Node,
    message: string,
    code: DiagnosticCode,
  ): void {
    this.diagnostics.push(
      new CompilerDiagnostic(node, message, code, DiagnosticCategory.Warning),
    );
  }

  public reportUnsupported(node: Node): void {
    this.reportError(
      node,
      'Unsupported syntax',
      DiagnosticCode.UNSUPPORTED_SYNTAX,
    );
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

  public getType(node: Node, required: boolean = false): Type | undefined {
    let type = this.getNotAnyType(node.getType());

    if (type == null && TypeGuards.isExpression(node)) {
      type = this.getNotAnyType(node.getContextualType());
    }

    if (type == null) {
      if (required) {
        this.reportTypeError(node);
      } else {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getTypeOfSymbol(
    symbol: Symbol | undefined,
    node: Node,
    required: boolean = false,
  ): Type | undefined {
    if (symbol == null) {
      return undefined;
    }

    const type = this.getNotAnyType(symbol.getTypeAtLocation(node));
    if (type == null) {
      if (required) {
        this.reportTypeError(node);
      } else {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  public getSymbol(node: Node, required: boolean = false): Symbol | undefined {
    const symbol = node.getSymbol();
    if (symbol == null) {
      const message = 'Could not determine source symbol.';
      if (required) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased != null) {
      return aliased;
    }

    return symbol;
  }

  public getSymbolForType(
    node: Node,
    type: Type | undefined,
    required: boolean = false,
  ): Symbol | undefined {
    if (type == null) {
      return undefined;
    }

    const symbol = type.getSymbol();
    if (symbol == null) {
      const message = `Could not determine source symbol for type: ${type.getText()}.`;
      if (required) {
        this.reportError(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      } else {
        this.reportWarning(node, message, DiagnosticCode.UNKNOWN_SYMBOL);
      }

      return undefined;
    }

    const aliased = symbol.getAliasedSymbol();
    if (aliased != null) {
      return aliased;
    }

    return symbol;
  }

  public assertUnreachable(value: never): never {
    throw new Error('Should not be reached.');
  }

  public assertNotNull<T>(value: T | undefined | null): T {
    if (value == null) {
      throw new Error('Something went wrong. Unexpected null.');
    }

    return value;
  }

  public isOnlyGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean {
    return (
      this.isSymbolic(type) &&
      this.isGlobalSymbol(node, this.getSymbolForType(node, type), name)
    );
  }

  // TODO: This should check unions
  public isGlobal(
    node: Node,
    type: Type | undefined,
    name: keyof Globals,
  ): boolean {
    return (
      this.isSymbolic(type) &&
      this.isGlobalSymbol(node, this.getSymbolForType(node, type), name)
    );
  }

  public isGlobalSymbol(
    node: Node,
    symbol: Symbol | undefined,
    name: keyof Globals,
  ): boolean {
    return symbol === this.globals[name];
  }

  public isOnlyLib(
    node: Node,
    type: Type | undefined,
    name: keyof Libs,
  ): boolean {
    return (
      this.isSymbolic(type) &&
      this.isLibSymbol(node, this.getSymbolForType(node, type), name)
    );
  }

  public isLibSymbol(
    node: Node,
    symbol: Symbol | undefined,
    name: keyof Libs,
  ): boolean {
    return symbol === this.libs[name];
  }

  public isLibAlias(
    identifier: Identifier | undefined,
    name: keyof LibAliases,
  ): boolean {
    if (identifier == null) {
      return false;
    }

    return this.libAliases[name].has(identifier);
  }

  private isSymbolic(type: Type | undefined): boolean {
    return (
      type == null ||
      (!typeUtils.isLiteral(type) &&
        !typeUtils.isPrimitive(type) &&
        !typeUtils.isTuple(type) &&
        !typeUtils.isUnion(type) &&
        !typeUtils.isIntersection(type))
    );
  }

  private getNotAnyType(type: Type | undefined): Type | undefined {
    // tslint:disable-next-line no-bitwise
    if (type == null || (type.getFlags() & TypeFlags.Any) !== 0) {
      return undefined;
    }

    return type;
  }
}
