import { SourceMaps } from './processActionsAndMessage';

export interface ProcessTraceTrace {
  readonly address: string;
  readonly line: number;
}

export interface ProcessTraceResult {
  readonly line: number;
  readonly column: number | undefined;
  readonly file: string;
  readonly token: string;
}

export interface ProcessTraceOptions {
  readonly trace: ReadonlyArray<ProcessTraceTrace>;
  readonly sourceMaps?: SourceMaps;
}
