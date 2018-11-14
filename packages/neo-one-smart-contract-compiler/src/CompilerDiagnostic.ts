import ts from 'typescript';

export class CompilerDiagnostic implements ts.Diagnostic {
  public readonly start: number;
  public readonly length: number;
  // tslint:disable-next-line readonly-keyword
  public file: ts.SourceFile;
  public readonly source: string;

  public constructor(
    node: ts.Node,
    public readonly messageText: string,
    public readonly code: number,
    public readonly category: ts.DiagnosticCategory,
  ) {
    this.file = node.getSourceFile();
    this.start = node.getStart();
    this.length = node.getWidth();
    this.source = 'neo-one';
  }
}
