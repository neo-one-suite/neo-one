import { DiagnosticCategory, Node, ts } from 'ts-simple-ast';

export class CompilerDiagnostic implements ts.Diagnostic {
  constructor(
    private readonly node: Node,
    public readonly messageText: string,
    public readonly code: number,
    public readonly category: DiagnosticCategory,
  ) {}

  public get file(): ts.SourceFile | undefined {
    return this.node.getSourceFile().compilerNode;
  }

  public get start(): number {
    return this.node.getStart();
  }

  public get length(): number {
    return this.node.getWidth();
  }

  public get source(): string {
    return this.node.getText();
  }
}
