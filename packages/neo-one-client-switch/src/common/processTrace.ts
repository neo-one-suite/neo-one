import { RawSourceMap } from 'source-map';

export interface ProcessTraceTrace {
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
  readonly sourceMap?: RawSourceMap;
}
