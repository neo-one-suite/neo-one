import { RawSourceMap } from 'source-map';

export interface ProcessErrorError {
  readonly line: number;
  readonly message: string;
}

export interface ProcessErrorTrace {
  readonly line: number;
}

export interface ProcessErrorOptions {
  readonly message: string;
  readonly error?: ProcessErrorError;
  readonly trace: ReadonlyArray<ProcessErrorTrace>;
  readonly sourceMap?: RawSourceMap;
}
