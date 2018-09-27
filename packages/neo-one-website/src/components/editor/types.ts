export type EditorFiles = ReadonlyArray<EditorFile>;

export type EditorFileType = 'typescript' | 'contract';

export interface EditorFile {
  readonly path: string;
  readonly content: string;
  readonly writable: boolean;
  readonly type: EditorFileType;
}

export type ConsoleType = 'output' | 'problems';

export type FileDiagnosticSeverity = 'hint' | 'info' | 'warning' | 'error';

export interface TextRange {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

export interface FileDiagnostic extends TextRange {
  readonly path: string;
  readonly owner: string;
  readonly message: string;
  readonly severity: FileDiagnosticSeverity;
}
