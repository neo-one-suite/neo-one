export type FileDiagnosticSeverity = 'hint' | 'info' | 'warning' | 'error';

export interface TextRange {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber?: number;
  readonly endColumn?: number;
}

export interface FileDiagnostic extends TextRange {
  readonly path: string;
  readonly owner: string;
  readonly message: string;
  readonly severity: FileDiagnosticSeverity;
}

export type EditorFiles = ReadonlyArray<EditorFile>;

export interface EditorFile {
  readonly path: string;
  readonly writable: boolean;
}

export type ConsoleType = 'output' | 'problems' | 'test';
