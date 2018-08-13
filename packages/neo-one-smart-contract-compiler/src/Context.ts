// tslint:disable ban-types
import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts, { DiagnosticCategory } from 'typescript';
import { format } from 'util';
import { AnalysisService } from './analysis';
import { Builtins, createBuiltins } from './compile/builtins';
import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { DiagnosticMessage } from './DiagnosticMessage';
import { createMemoized, nodeKey, symbolKey, typeKey } from './utils';

export interface DiagnosticOptions {
  readonly error?: boolean;
  readonly warning?: boolean;
}

export const DEFAULT_DIAGNOSTIC_OPTIONS = {
  error: false,
  warning: true,
};

const getErrorKey = (diagnostic: ts.Diagnostic) =>
  `${diagnostic.file}:${diagnostic.start}:${diagnostic.length}:${diagnostic.code}`;
const getFullKey = (diagnostic: ts.Diagnostic) =>
  `${diagnostic.file}:${diagnostic.start}:${diagnostic.length}:${diagnostic.category}:${diagnostic.code}:${
    diagnostic.messageText
  }`;

export class Context {
  public readonly builtins: Builtins;
  public readonly analysis: AnalysisService;
  private readonly memoized = createMemoized();

  public constructor(
    public readonly program: ts.Program,
    public readonly typeChecker: ts.TypeChecker,
    public readonly languageService: ts.LanguageService,
    public readonly smartContractDir: string,
    private readonly mutableDiagnostics: ts.Diagnostic[] = ts.getPreEmitDiagnostics(program),
  ) {
    this.builtins = createBuiltins(this);
    this.analysis = new AnalysisService(this);
  }

  public get diagnostics(): ReadonlyArray<ts.Diagnostic> {
    const errorDiagnostics = new Set<string>();
    // tslint:disable-next-line no-loop-statement
    for (const diagnostic of this.mutableDiagnostics) {
      if (diagnostic.category === DiagnosticCategory.Error) {
        errorDiagnostics.add(getErrorKey(diagnostic));
      }
    }

    const diagnostics = this.mutableDiagnostics.filter(
      (diagnostic) =>
        diagnostic.category === DiagnosticCategory.Error || !errorDiagnostics.has(getErrorKey(diagnostic)),
    );

    return _.uniqBy(diagnostics, getFullKey);
  }

  public update(
    program: ts.Program,
    typeChecker: ts.TypeChecker,
    languageService: ts.LanguageService,
    smartContractDir: string,
  ): Context {
    return new Context(program, typeChecker, languageService, smartContractDir, [...this.mutableDiagnostics]);
  }

  public reportError(
    node: ts.Node,
    code: DiagnosticCode,
    message: DiagnosticMessage,
    // tslint:disable-next-line no-any readonly-array
    ...args: any[]
  ): void {
    this.mutableDiagnostics.push(
      new CompilerDiagnostic(node, this.getDiagnosticMessage(message, ...args), code, ts.DiagnosticCategory.Error),
    );
  }

  // tslint:disable-next-line no-any readonly-array
  public reportWarning(node: ts.Node, code: DiagnosticCode, message: DiagnosticMessage, ...args: any[]): void {
    this.mutableDiagnostics.push(
      new CompilerDiagnostic(node, this.getDiagnosticMessage(message, ...args), code, ts.DiagnosticCategory.Warning),
    );
  }

  public reportUnsupported(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.GenericUnsupportedSyntax, DiagnosticMessage.GenericUnsupportedSyntax);
  }

  public reportUnsupportedEfficiency(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.GenericUnsupportedSyntax, DiagnosticMessage.EfficiencyUnsupportedSyntax);
  }

  public reportTypeError(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.UnknownType, DiagnosticMessage.CouldNotInferType);
  }

  public reportTypeWarning(node: ts.Node): void {
    this.reportWarning(node, DiagnosticCode.UnknownType, DiagnosticMessage.CouldNotInferTypeDeopt);
  }

  public getType(
    node: ts.Node,
    {
      warning = DEFAULT_DIAGNOSTIC_OPTIONS.warning,
      error = DEFAULT_DIAGNOSTIC_OPTIONS.error,
    }: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Type | undefined {
    return this.memoized('type', nodeKey(node), () => {
      const type = this.getNotAnyTypeBase(tsUtils.type_.getType(this.typeChecker, node));

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
    });
  }

  public getTypeOfSymbol(
    symbol: ts.Symbol | undefined,
    node: ts.Node,
    {
      warning = DEFAULT_DIAGNOSTIC_OPTIONS.warning,
      error = DEFAULT_DIAGNOSTIC_OPTIONS.error,
    }: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Type | undefined {
    if (symbol === undefined) {
      return undefined;
    }

    return this.memoized('type-of-symbol', `${symbolKey(symbol)}:${nodeKey(node)}`, () => {
      const type = this.getNotAnyTypeBase(tsUtils.type_.getTypeAtLocation(this.typeChecker, symbol, node));
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
    });
  }

  public getSymbol(
    node: ts.Node,
    {
      warning = DEFAULT_DIAGNOSTIC_OPTIONS.warning,
      error = DEFAULT_DIAGNOSTIC_OPTIONS.error,
    }: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Symbol | undefined {
    return this.memoized('symbol', nodeKey(node), () => {
      const symbol = tsUtils.node.getSymbol(this.typeChecker, node);
      if (symbol === undefined) {
        if (error) {
          this.reportSymbolError(node);
        } else if (warning) {
          this.reportSymbolWarning(node);
        }

        return undefined;
      }

      const aliased = tsUtils.symbol.getAliasedSymbol(this.typeChecker, symbol);
      if (aliased !== undefined) {
        return aliased;
      }

      return symbol;
    });
  }

  public getTypeSymbol(
    node: ts.Node,
    {
      warning = DEFAULT_DIAGNOSTIC_OPTIONS.warning,
      error = DEFAULT_DIAGNOSTIC_OPTIONS.error,
    }: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Symbol | undefined {
    return this.memoized('type-symbol', nodeKey(node), () => {
      const noWarnOrError = { warning: false, error: false };
      const type = this.getType(node, noWarnOrError);
      const symbol = this.getSymbolForType(node, type, noWarnOrError);
      if (symbol === undefined) {
        if (error) {
          this.reportSymbolError(node);
        } else if (warning) {
          this.reportSymbolWarning(node);
        }

        return undefined;
      }

      return symbol;
    });
  }

  public getSymbolForType(
    _node: ts.Node,
    type: ts.Type | undefined,
    _options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Symbol | undefined {
    if (type === undefined) {
      return undefined;
    }

    return this.memoized('symbol-for-type', typeKey(type), () => {
      let symbol = tsUtils.type_.getSymbol(type);
      if (symbol === undefined) {
        symbol = tsUtils.type_.getAliasSymbol(type);
      }

      if (symbol === undefined) {
        return undefined;
      }

      const aliased = tsUtils.symbol.getAliasedSymbol(this.typeChecker, symbol);
      if (aliased !== undefined) {
        return aliased;
      }

      return symbol;
    });
  }

  public getNotAnyType(
    node: ts.Node,
    typeIn: ts.Type | undefined,
    {
      warning = DEFAULT_DIAGNOSTIC_OPTIONS.warning,
      error = DEFAULT_DIAGNOSTIC_OPTIONS.error,
    }: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Type | undefined {
    const type = this.getNotAnyTypeBase(typeIn);
    if (type === undefined) {
      if (error) {
        this.reportTypeError(node);
      } else if (warning) {
        this.reportTypeWarning(node);
      }
    }

    return type;
  }

  private getNotAnyTypeBase(type: ts.Type | undefined): ts.Type | undefined {
    // tslint:disable-next-line no-bitwise
    if (type === undefined || tsUtils.type_.isAny(type)) {
      return undefined;
    }

    return type;
  }

  private reportSymbolError(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.UnknownSymbol, DiagnosticMessage.CouldNotInferSymbol);
  }

  private reportSymbolWarning(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.UnknownSymbol, DiagnosticMessage.CouldNotInferSymbolDeopt);
  }

  // tslint:disable-next-line no-any readonly-array
  private getDiagnosticMessage(message: DiagnosticMessage, ...args: any[]): string {
    const match = message.match(/%[dfijoOs]/g);
    const expectedLength = (match === null ? [] : match).length;
    if (expectedLength !== args.length) {
      throw new Error(
        `The provided arguments length (${
          args.length
        }) does not match the required arguments length (${expectedLength})`,
      );
    }

    return format(message, ...args);
  }
}
