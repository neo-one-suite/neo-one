import { SourceMaps } from './processActionsAndMessage';

export interface ProcessErrorError {
  readonly address: string;
  readonly line: number;
  readonly message: string;
}

export interface ProcessErrorTrace {
  readonly address: string;
  readonly line: number;
}

export interface ProcessErrorOptions {
  readonly message: string;
  readonly error?: ProcessErrorError;
  readonly trace?: ReadonlyArray<ProcessErrorTrace>;
  readonly sourceMaps?: SourceMaps;
}
