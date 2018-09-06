// tslint:disable ban-types
import _ from 'lodash';
import ts, { DiagnosticCategory } from 'typescript';
import { format } from 'util';
import { AnalysisService } from './analysis';
import { Builtins, createBuiltins } from './compile/builtins';
import { CompilerDiagnostic } from './CompilerDiagnostic';
import { DiagnosticCode } from './DiagnosticCode';
import { DiagnosticMessage } from './DiagnosticMessage';

const getErrorKey = (diagnostic: ts.Diagnostic) =>
  `${diagnostic.file}:${diagnostic.start}:${diagnostic.length}:${diagnostic.code}`;
const getFullKey = (diagnostic: ts.Diagnostic) =>
  `${diagnostic.file}:${diagnostic.start}:${diagnostic.length}:${diagnostic.category}:${diagnostic.code}:${
    diagnostic.messageText
  }`;

export class Context {
  public readonly builtins: Builtins;
  public readonly analysis: AnalysisService;

  public constructor(
    public readonly program: ts.Program,
    public readonly typeChecker: ts.TypeChecker,
    public readonly languageService: ts.LanguageService,
    public readonly smartContractDir: string,
    private readonly mutableDiagnostics: ts.Diagnostic[] = ts.getPreEmitDiagnostics(program),
  ) {
    this.analysis = new AnalysisService(this);
    this.builtins = createBuiltins(this);
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
    this.reportError(node, DiagnosticCode.UnsupportedSyntax, DiagnosticMessage.UnsupportedSyntax);
  }

  public reportUnsupportedEfficiency(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.UnsupportedSyntax, DiagnosticMessage.EfficiencyUnsupportedSyntax);
  }

  public reportTypeError(node: ts.Node): void {
    this.reportError(node, DiagnosticCode.UnknownType, DiagnosticMessage.CouldNotInferType);
  }

  public reportTypeWarning(node: ts.Node): void {
    this.reportWarning(node, DiagnosticCode.UnknownType, DiagnosticMessage.CouldNotInferTypeDeopt);
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
