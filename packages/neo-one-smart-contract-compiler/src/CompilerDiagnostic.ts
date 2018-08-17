import ts from 'typescript';

export class CompilerDiagnostic implements ts.Diagnostic {
  public constructor(
    public readonly node: ts.Node,
    public readonly messageText: string,
    public readonly code: number,
    public readonly category: ts.DiagnosticCategory,
  ) {}

  public get file(): ts.SourceFile {
    return this.node.getSourceFile();
  }

  public get start(): number {
    return this.node.getStart();
  }

  public get length(): number {
    return this.node.getWidth();
  }

  public get source(): string {
    return 'neo-one';
  }
}
